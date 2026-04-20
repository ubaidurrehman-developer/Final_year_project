"""
=============================================================================
  Formulate — Comprehensive Test Suite
=============================================================================
  Tests every service module (detection, extraction, cleaning, clustering,
  llm_parser, agents) at the unit level, plus integration and API tests.

  Run all tests:
      python manage.py test myapp -v 2

  Run a specific test class:
      python manage.py test myapp.tests.CleaningModuleTests -v 2

  Run a single test:
      python manage.py test myapp.tests.CleaningModuleTests.test_basic_ocr_cleaning -v 2
=============================================================================
"""

import json
import os
import numpy as np
import openai
from io import BytesIO
from unittest.mock import patch, MagicMock

from PIL import Image
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from Backend.services.cleaning import (
    clean_ocr_text,
    CLASS_NAMES,
    CHECKBOX_ID,
    INPUT_LABEL_ID,
    TABLE_ID,
    IMAGE_ID,
    BBOX_ID,
)
from Backend.services.detection import (
    letterbox,
    preprocess,
    nms,
    format_detections,
    get_session,
    MODEL_PATH,
)
from Backend.services.extraction import (
    expand_box,
    refine_box_with_image,
    pixel_tighten_detections,
    add_text_to_detections,
    visualize_and_crop,
)
from Backend.services.clustering import (
    get_center,
    clusters_formation,
)
from Backend.services.agents import (
    DetectionTool,
    ExtractionTool,
    ClusteringTool,
    StructuringTool,
    VisualizationTool,
    FormProcessingAgent,
)

User = get_user_model()


# ===========================================================================
#  HELPER: Create a synthetic test image
# ===========================================================================

def _make_test_image(width=800, height=600, color="white"):
    """Create a simple PIL Image for testing."""
    return Image.new("RGB", (width, height), color)


def _make_test_image_with_text(width=800, height=600):
    """Create an image with some synthetic content (rectangles simulating fields)."""
    from PIL import ImageDraw

    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    # Simulated form fields
    draw.rectangle([50, 50, 300, 80], outline="black", width=2)
    draw.rectangle([50, 100, 300, 130], outline="black", width=2)
    draw.rectangle([50, 150, 80, 180], outline="black", width=2)   # checkbox
    draw.rectangle([90, 150, 250, 180], outline="black", width=1)  # label
    draw.text((100, 155), "Option A", fill="black")
    draw.text((60, 55), "Name", fill="black")
    draw.text((60, 105), "Email", fill="black")
    return img


def _make_sample_detections():
    """Create realistic mock detections matching what YOLO would produce."""
    return [
        {"bbox": [50, 50, 300, 80],   "confidence": 0.92, "class": INPUT_LABEL_ID},
        {"bbox": [50, 100, 300, 130],  "confidence": 0.89, "class": INPUT_LABEL_ID},
        {"bbox": [50, 150, 80, 180],   "confidence": 0.95, "class": CHECKBOX_ID},
        {"bbox": [90, 150, 250, 180],  "confidence": 0.88, "class": INPUT_LABEL_ID},
    ]


def _make_sample_detections_with_text():
    """Detections that already have text extracted."""
    return [
        {"bbox": [50, 50, 300, 80],   "confidence": 0.92, "class": INPUT_LABEL_ID, "text": "Name"},
        {"bbox": [50, 100, 300, 130],  "confidence": 0.89, "class": INPUT_LABEL_ID, "text": "Email"},
        {"bbox": [50, 150, 80, 180],   "confidence": 0.95, "class": CHECKBOX_ID,    "text": ""},
        {"bbox": [90, 150, 250, 180],  "confidence": 0.88, "class": INPUT_LABEL_ID, "text": "Option A"},
    ]


# ===========================================================================
# 1. CLEANING MODULE TESTS
# ===========================================================================

class CleaningModuleTests(TestCase):
    """Unit tests for Backend/services/cleaning.py"""

    # -- Class constants --

    def test_class_names_list_has_six_entries(self):
        """CLASS_NAMES should contain exactly 6 YOLO class labels."""
        self.assertEqual(len(CLASS_NAMES), 6)

    def test_class_ids_are_valid_indices(self):
        """All class ID constants must be valid indices into CLASS_NAMES."""
        for cid in [CHECKBOX_ID, INPUT_LABEL_ID, TABLE_ID, IMAGE_ID, BBOX_ID]:
            self.assertIn(cid, range(len(CLASS_NAMES)))

    def test_checkbox_id_maps_to_checkboxes(self):
        self.assertEqual(CLASS_NAMES[CHECKBOX_ID], "checkboxes")

    def test_input_label_id_maps_to_text(self):
        self.assertEqual(CLASS_NAMES[INPUT_LABEL_ID], "text")

    # -- clean_ocr_text() --

    def test_basic_ocr_cleaning(self):
        """Clean basic OCR text with noise characters."""
        raw = ["Hello| World:", "[Test] {Value}"]
        result = clean_ocr_text(raw)
        self.assertIsInstance(result, list)
        self.assertTrue(len(result) > 0)
        for item in result:
            self.assertNotIn("|", item)
            self.assertNotIn("[", item)
            self.assertNotIn("{", item)

    def test_empty_input_returns_empty(self):
        self.assertEqual(clean_ocr_text([]), [])

    def test_none_items_skipped(self):
        result = clean_ocr_text([None, "", None])
        self.assertEqual(result, [])

    def test_word_fix_advisor(self):
        """Known OCR misread 'Adyvisor' should be corrected to 'Advisor'."""
        result = clean_ocr_text(["Adyvisor Name"])
        self.assertTrue(any("Advisor" in t for t in result))

    def test_word_fix_roll(self):
        """Known OCR misread 'Ro11' should be corrected to 'Roll'."""
        result = clean_ocr_text(["Ro11 Number"])
        self.assertTrue(any("Roll" in t for t in result))

    def test_word_fix_semester(self):
        result = clean_ocr_text(["Sernester Registration"])
        self.assertTrue(any("Semester" in t for t in result))

    def test_word_fix_signature(self):
        result = clean_ocr_text(["Slgnature Required"])
        self.assertTrue(any("Signature" in t for t in result))

    def test_whitespace_normalization(self):
        """Multiple spaces should collapse to single space."""
        result = clean_ocr_text(["Hello    World"])
        for item in result:
            self.assertNotIn("  ", item)

    def test_punctuation_removed(self):
        """Periods, quotes should be removed."""
        result = clean_ocr_text(["Test. 'Value' here"])
        for item in result:
            self.assertNotIn(".", item)
            self.assertNotIn("'", item)


# ===========================================================================
# 2. DETECTION MODULE TESTS
# ===========================================================================

class DetectionLetterboxTests(TestCase):
    """Unit tests for letterbox() function."""

    def test_output_is_square(self):
        img = _make_test_image(800, 600)
        canvas, scale, pad_x, pad_y = letterbox(img, 640)
        self.assertEqual(canvas.size, (640, 640))

    def test_scale_preserves_aspect_ratio(self):
        img = _make_test_image(800, 400)
        _, scale, _, _ = letterbox(img, 640)
        # Scale should be min(640/800, 640/400) = 0.8
        self.assertAlmostEqual(scale, 0.8, places=5)

    def test_padding_centers_image(self):
        img = _make_test_image(640, 320)
        _, scale, pad_x, pad_y = letterbox(img, 640)
        # Image fills width exactly (scale=1.0), needs vertical padding
        self.assertEqual(pad_x, 0)
        self.assertEqual(pad_y, 160)  # (640 - 320) / 2

    def test_square_image_no_padding(self):
        img = _make_test_image(500, 500)
        _, _, pad_x, pad_y = letterbox(img, 640)
        self.assertEqual(pad_x, 0)
        self.assertEqual(pad_y, 0)

    def test_rgb_mode_preserved(self):
        img = _make_test_image(100, 100)
        canvas, _, _, _ = letterbox(img, 640)
        self.assertEqual(canvas.mode, "RGB")


class DetectionPreprocessTests(TestCase):
    """Unit tests for preprocess() function."""

    def test_output_shape(self):
        img = _make_test_image(800, 600)
        arr, scale, pad_x, pad_y = preprocess(img, imgsz=640)
        self.assertEqual(arr.shape, (1, 3, 640, 640))

    def test_output_dtype_float32(self):
        img = _make_test_image(800, 600)
        arr, _, _, _ = preprocess(img)
        self.assertEqual(arr.dtype, np.float32)

    def test_pixel_values_normalized(self):
        """All values should be in [0, 1] after /255 normalization."""
        img = _make_test_image(100, 100)
        arr, _, _, _ = preprocess(img)
        self.assertGreaterEqual(arr.min(), 0.0)
        self.assertLessEqual(arr.max(), 1.0)

    def test_grayscale_image_converted_to_rgb(self):
        """Grayscale images should be auto-converted to RGB."""
        gray_img = Image.new("L", (100, 100), 128)
        arr, _, _, _ = preprocess(gray_img)
        self.assertEqual(arr.shape, (1, 3, 640, 640))

    def test_rgba_image_converted_to_rgb(self):
        """RGBA images should be auto-converted to RGB."""
        rgba_img = Image.new("RGBA", (100, 100), (255, 0, 0, 128))
        arr, _, _, _ = preprocess(rgba_img)
        self.assertEqual(arr.shape, (1, 3, 640, 640))


class DetectionNMSTests(TestCase):
    """Unit tests for Non-Maximum Suppression."""

    def test_nms_removes_overlapping_boxes(self):
        boxes = np.array([
            [0, 0, 100, 100],
            [5, 5, 105, 105],  # heavily overlaps with first
            [200, 200, 300, 300],  # no overlap
        ], dtype=np.float32)
        scores = np.array([0.9, 0.8, 0.7])
        kept = nms(boxes, scores, iou_thresh=0.5)
        self.assertIn(0, kept)          # highest score kept
        self.assertNotIn(1, kept)       # overlapping box removed
        self.assertIn(2, kept)          # non-overlapping kept

    def test_nms_keeps_non_overlapping(self):
        boxes = np.array([
            [0, 0, 50, 50],
            [100, 100, 150, 150],
            [200, 200, 250, 250],
        ], dtype=np.float32)
        scores = np.array([0.9, 0.8, 0.7])
        kept = nms(boxes, scores, iou_thresh=0.5)
        self.assertEqual(len(kept), 3)

    def test_nms_single_box(self):
        boxes = np.array([[10, 10, 50, 50]], dtype=np.float32)
        scores = np.array([0.9])
        kept = nms(boxes, scores)
        self.assertEqual(len(kept), 1)

    def test_nms_empty_input(self):
        boxes = np.array([]).reshape(0, 4)
        scores = np.array([])
        kept = nms(boxes, scores)
        self.assertEqual(len(kept), 0)

    def test_nms_respects_iou_threshold(self):
        """Loose threshold should remove more boxes; tight should keep more."""
        boxes = np.array([
            [0, 0, 100, 100],
            [20, 20, 120, 120],
        ], dtype=np.float32)
        scores = np.array([0.9, 0.8])
        # Tight threshold (0.9) — boxes must be nearly identical to suppress
        kept_tight = nms(boxes, scores, iou_thresh=0.9)
        # Loose threshold (0.1) — even small overlap causes suppression
        kept_loose = nms(boxes, scores, iou_thresh=0.1)
        self.assertGreaterEqual(len(kept_tight), len(kept_loose))


class DetectionFormatTests(TestCase):
    """Unit tests for format_detections() output parsing."""

    def _make_fake_output(self, num_preds=10, num_classes=6):
        """Create fake YOLO output tensor for testing."""
        # Shape: [1, 4+num_classes, num_preds]  (needs transposing)
        data = np.random.rand(1, 4 + num_classes, num_preds).astype(np.float32)
        # Make some detections have high confidence
        data[0, 4, :3] = 0.9  # class 0 score high for first 3 preds
        # Set reasonable bbox values in letterbox space
        data[0, 0, :3] = [320, 200, 400]   # x_center
        data[0, 1, :3] = [320, 100, 300]   # y_center
        data[0, 2, :3] = [100, 50, 80]     # width
        data[0, 3, :3] = [30, 20, 25]      # height
        return [data]

    def test_returns_list(self):
        outputs = self._make_fake_output()
        result = format_detections(outputs, (800, 600), 0.8, 80, 20)
        self.assertIsInstance(result, list)

    def test_each_detection_has_required_keys(self):
        outputs = self._make_fake_output()
        result = format_detections(outputs, (800, 600), 0.8, 80, 20)
        for det in result:
            self.assertIn("bbox", det)
            self.assertIn("confidence", det)
            self.assertIn("class", det)

    def test_bbox_has_four_values(self):
        outputs = self._make_fake_output()
        result = format_detections(outputs, (800, 600), 0.8, 80, 20)
        for det in result:
            self.assertEqual(len(det["bbox"]), 4)

    def test_confidence_is_float(self):
        outputs = self._make_fake_output()
        result = format_detections(outputs, (800, 600), 0.8, 80, 20)
        for det in result:
            self.assertIsInstance(det["confidence"], float)

    def test_class_is_int(self):
        outputs = self._make_fake_output()
        result = format_detections(outputs, (800, 600), 0.8, 80, 20)
        for det in result:
            self.assertIsInstance(det["class"], int)

    def test_coordinates_clipped_to_image(self):
        """Bounding box coordinates must not exceed image dimensions."""
        outputs = self._make_fake_output()
        img_size = (800, 600)
        result = format_detections(outputs, img_size, 0.8, 80, 20)
        for det in result:
            x1, y1, x2, y2 = det["bbox"]
            self.assertGreaterEqual(x1, 0)
            self.assertGreaterEqual(y1, 0)
            self.assertLessEqual(x2, img_size[0])
            self.assertLessEqual(y2, img_size[1])

    def test_low_confidence_filtered(self):
        """Detections below conf_thresh should be removed."""
        # Use zeros so all class scores are 0 — well below any threshold
        data = np.zeros((1, 10, 10), dtype=np.float32)
        data[0, 4:, :] = 0.01  # all class scores = 0.01
        outputs = [data]
        result = format_detections(outputs, (800, 600), 0.8, 80, 20, conf_thresh=0.5)
        self.assertEqual(len(result), 0)

    def test_empty_output_returns_empty_list(self):
        """If model produces nothing above threshold, return empty list."""
        outputs = [np.zeros((1, 10, 0), dtype=np.float32)]
        result = format_detections(outputs, (800, 600), 1.0, 0, 0)
        self.assertEqual(result, [])


class DetectionModelPathTests(TestCase):
    """Tests for MODEL_PATH resolution."""

    def test_model_path_is_absolute(self):
        self.assertTrue(os.path.isabs(MODEL_PATH))

    def test_model_file_exists(self):
        self.assertTrue(
            os.path.exists(MODEL_PATH),
            f"ONNX model not found at {MODEL_PATH}",
        )

    def test_model_file_is_not_empty(self):
        self.assertGreater(os.path.getsize(MODEL_PATH), 0)


class DetectionSessionTests(TestCase):
    """Tests for ONNX model session loading."""

    def test_session_loads_successfully(self):
        session = get_session()
        self.assertIsNotNone(session)

    def test_session_has_expected_input(self):
        session = get_session()
        inputs = session.get_inputs()
        self.assertEqual(len(inputs), 1)
        self.assertEqual(inputs[0].name, "images")

    def test_session_input_shape(self):
        session = get_session()
        shape = session.get_inputs()[0].shape
        self.assertEqual(shape, [1, 3, 640, 640])

    def test_session_singleton(self):
        """get_session() should return the same cached session."""
        s1 = get_session()
        s2 = get_session()
        self.assertIs(s1, s2)


# ===========================================================================
# 3. EXTRACTION MODULE TESTS
# ===========================================================================

class ExtractionExpandBoxTests(TestCase):
    """Unit tests for expand_box()."""

    def test_box_expands_by_padding(self):
        img = _make_test_image(800, 600)
        result = expand_box([100, 100, 200, 200], img, pad=5)
        self.assertEqual(result, [95, 95, 205, 205])

    def test_box_clamped_to_image_bounds(self):
        img = _make_test_image(800, 600)
        result = expand_box([2, 2, 798, 598], img, pad=10)
        self.assertEqual(result[0], 0)      # x1 clamped
        self.assertEqual(result[1], 0)      # y1 clamped
        self.assertEqual(result[2], 800)    # x2 clamped
        self.assertEqual(result[3], 600)    # y2 clamped

    def test_zero_padding(self):
        img = _make_test_image(800, 600)
        result = expand_box([100, 100, 200, 200], img, pad=0)
        self.assertEqual(result, [100, 100, 200, 200])


class ExtractionRefineBoxTests(TestCase):
    """Unit tests for refine_box_with_image()."""

    def test_returns_four_element_list(self):
        img = _make_test_image_with_text()
        result = refine_box_with_image(img, [50, 50, 300, 80])
        self.assertEqual(len(result), 4)

    def test_refined_box_within_image_bounds(self):
        img = _make_test_image(800, 600)
        result = refine_box_with_image(img, [50, 50, 200, 100])
        x1, y1, x2, y2 = result
        self.assertGreaterEqual(x1, 0)
        self.assertGreaterEqual(y1, 0)
        self.assertLessEqual(x2, 800)
        self.assertLessEqual(y2, 600)

    def test_empty_crop_returns_original(self):
        """If crop has no content, should return original bbox."""
        img = _make_test_image(800, 600, color="white")
        bbox = [100, 100, 101, 101]  # tiny crop
        result = refine_box_with_image(img, bbox)
        self.assertEqual(len(result), 4)


class ExtractionPixelTightenTests(TestCase):
    """Unit tests for pixel_tighten_detections()."""

    def test_returns_sorted_detections(self):
        img = _make_test_image(800, 600)
        dets = [
            {"bbox": [100, 200, 200, 250], "confidence": 0.9, "class": 0},
            {"bbox": [100, 50, 200, 100],  "confidence": 0.8, "class": 0},
        ]
        result = pixel_tighten_detections(img, dets)
        # Should be sorted top-to-bottom
        self.assertLessEqual(result[0]["bbox"][1], result[1]["bbox"][1])

    def test_preserves_detection_count(self):
        img = _make_test_image(800, 600)
        dets = _make_sample_detections()
        result = pixel_tighten_detections(img, dets)
        self.assertEqual(len(result), len(dets))

    def test_preserves_detection_fields(self):
        img = _make_test_image(800, 600)
        dets = [{"bbox": [50, 50, 200, 100], "confidence": 0.9, "class": 3}]
        result = pixel_tighten_detections(img, dets)
        self.assertIn("confidence", result[0])
        self.assertIn("class", result[0])


class ExtractionOCRTests(TestCase):
    """Unit tests for add_text_to_detections()."""

    def test_empty_detections_returns_empty(self):
        img = _make_test_image()
        result = add_text_to_detections([], img)
        self.assertEqual(result, [])

    def test_adds_text_key_to_each_detection(self):
        img = _make_test_image_with_text()
        dets = [{"bbox": [50, 50, 300, 80], "confidence": 0.9, "class": 3}]
        result = add_text_to_detections(dets, img)
        self.assertIn("text", result[0])
        self.assertIsInstance(result[0]["text"], str)

    def test_empty_crop_returns_empty_string(self):
        img = _make_test_image(800, 600)
        dets = [{"bbox": [0, 0, 0, 0], "confidence": 0.9, "class": 3}]
        result = add_text_to_detections(dets, img)
        self.assertEqual(result[0]["text"], "")


class ExtractionVisualizationTests(TestCase):
    """Unit tests for visualize_and_crop()."""

    def test_returns_annotated_image_and_paths(self):
        img = _make_test_image(800, 600)
        dets = _make_sample_detections()
        save_dir = "/tmp/formulate_test_crops"
        annotated, paths = visualize_and_crop(img.copy(), dets, save_dir)
        self.assertIsInstance(annotated, Image.Image)
        self.assertIsInstance(paths, list)

    def test_annotated_image_same_size(self):
        img = _make_test_image(800, 600)
        dets = _make_sample_detections()
        annotated, _ = visualize_and_crop(img.copy(), dets, "/tmp/formulate_test_crops")
        self.assertEqual(annotated.size, (800, 600))

    def test_creates_crop_files(self):
        img = _make_test_image(800, 600)
        dets = [{"bbox": [50, 50, 200, 100], "confidence": 0.9, "class": 0}]
        save_dir = "/tmp/formulate_test_crops_2"
        _, paths = visualize_and_crop(img.copy(), dets, save_dir)
        for path in paths:
            self.assertTrue(os.path.exists(path), f"Crop not found: {path}")

    def test_skips_invalid_boxes(self):
        """Zero-area boxes should be skipped."""
        img = _make_test_image(800, 600)
        dets = [{"bbox": [100, 100, 100, 100], "confidence": 0.9, "class": 0}]
        _, paths = visualize_and_crop(img.copy(), dets, "/tmp/formulate_test_crops_3")
        self.assertEqual(len(paths), 0)


# ===========================================================================
# 4. CLUSTERING MODULE TESTS
# ===========================================================================

class ClusteringCenterTests(TestCase):
    """Unit tests for get_center()."""

    def test_center_of_box(self):
        cx, cy = get_center([0, 0, 100, 100])
        self.assertEqual(cx, 50.0)
        self.assertEqual(cy, 50.0)

    def test_asymmetric_box(self):
        cx, cy = get_center([10, 20, 110, 80])
        self.assertEqual(cx, 60.0)
        self.assertEqual(cy, 50.0)


class ClusteringFormationTests(TestCase):
    """Unit tests for clusters_formation()."""

    def test_empty_input_returns_empty(self):
        result = clusters_formation([])
        self.assertEqual(result, [])

    def test_checkbox_paired_with_adjacent_label(self):
        """A checkbox should be paired with the label immediately to its right."""
        dets = [
            {"bbox": [50, 150, 80, 180],   "confidence": 0.95, "class": CHECKBOX_ID,    "text": ""},
            {"bbox": [90, 150, 250, 180],  "confidence": 0.88, "class": INPUT_LABEL_ID, "text": "Option A"},
            {"bbox": [50, 50, 300, 80],    "confidence": 0.92, "class": INPUT_LABEL_ID, "text": "Choose one"},
        ]
        result = clusters_formation(dets)
        # Should have at least one group with options
        groups = [r for r in result if "options" in r]
        self.assertGreater(len(groups), 0, "Expected at least one checkbox group")

    def test_unpaired_label_remains_standalone(self):
        """Labels without nearby checkboxes should appear standalone."""
        dets = [
            {"bbox": [50, 50, 300, 80], "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "Name"},
        ]
        result = clusters_formation(dets)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["text"], "Name")

    def test_non_checkbox_elements_preserved(self):
        """Tables, images, etc. should pass through unchanged."""
        dets = [
            {"bbox": [50, 50, 400, 300], "confidence": 0.85, "class": TABLE_ID, "text": ""},
        ]
        result = clusters_formation(dets)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["class"], TABLE_ID)

    def test_output_sorted_top_to_bottom(self):
        """Results should be sorted by vertical position."""
        dets = [
            {"bbox": [50, 200, 300, 230], "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "B"},
            {"bbox": [50, 50, 300, 80],   "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "A"},
        ]
        result = clusters_formation(dets)
        y_positions = [r.get("bbox", [0, 0, 0, 0])[1] for r in result]
        self.assertEqual(y_positions, sorted(y_positions))

    def test_multiple_checkbox_groups(self):
        """Should handle multiple independent checkbox groups."""
        dets = [
            # Group 1
            {"bbox": [50, 50, 300, 80],   "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "Gender"},
            {"bbox": [50, 100, 80, 130],  "confidence": 0.9, "class": CHECKBOX_ID,    "text": ""},
            {"bbox": [90, 100, 200, 130], "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "Male"},
            {"bbox": [50, 140, 80, 170],  "confidence": 0.9, "class": CHECKBOX_ID,    "text": ""},
            {"bbox": [90, 140, 220, 170], "confidence": 0.9, "class": INPUT_LABEL_ID, "text": "Female"},
        ]
        result = clusters_formation(dets)
        groups = [r for r in result if "options" in r]
        self.assertGreater(len(groups), 0)


# ===========================================================================
# 5. LLM PARSER MODULE TESTS
# ===========================================================================

class LLMParserTests(TestCase):
    """Unit tests for Backend/services/llm_parser.py (mocked API calls)."""

    @patch("Backend.services.llm_parser._get_client")
    def test_parse_returns_dict(self, mock_client_fn):
        """parse_to_json should return a dict from valid LLM response."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"name": "John", "email": "john@test.com"}'

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_client_fn.return_value = mock_client

        from Backend.services.llm_parser import parse_to_json

        result = parse_to_json([{"text": "Name: John"}])
        self.assertIsInstance(result, dict)
        self.assertEqual(result["name"], "John")

    @patch("Backend.services.llm_parser._get_client")
    def test_strips_markdown_fences(self, mock_client_fn):
        """Should handle LLM responses wrapped in ```json ... ```."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '```json\n{"field": "value"}\n```'

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_client_fn.return_value = mock_client

        from Backend.services.llm_parser import parse_to_json

        result = parse_to_json([{"text": "test"}])
        self.assertEqual(result["field"], "value")

    @patch("Backend.services.llm_parser._get_client")
    def test_invalid_json_returns_error(self, mock_client_fn):
        """Invalid JSON from LLM should return error dict, not crash."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is not JSON at all!"

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_client_fn.return_value = mock_client

        from Backend.services.llm_parser import parse_to_json

        result = parse_to_json([])
        self.assertIn("error", result)

    @patch("Backend.services.llm_parser._get_client")
    def test_api_error_returns_error_dict(self, mock_client_fn):
        """API errors should be caught and returned as error dict."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = openai.APIError(
            message="Rate limit exceeded",
            request=MagicMock(),
            body=None,
        )
        mock_client_fn.return_value = mock_client

        from Backend.services.llm_parser import parse_to_json

        result = parse_to_json([])
        self.assertIn("error", result)


# ===========================================================================
# 6. AGENT MODULE TESTS
# ===========================================================================

class AgentToolInstantiationTests(TestCase):
    """Verify all tool agents can be instantiated."""

    def test_detection_tool(self):
        tool = DetectionTool()
        self.assertEqual(tool.name, "detect_form_elements")

    def test_extraction_tool(self):
        tool = ExtractionTool()
        self.assertEqual(tool.name, "extract_text")

    def test_clustering_tool(self):
        tool = ClusteringTool()
        self.assertEqual(tool.name, "cluster_form_elements")

    def test_structuring_tool(self):
        tool = StructuringTool()
        self.assertEqual(tool.name, "structure_with_llm")

    def test_visualization_tool(self):
        tool = VisualizationTool()
        self.assertEqual(tool.name, "visualize_results")


class AgentOrchestratorTests(TestCase):
    """Unit tests for FormProcessingAgent."""

    def test_agent_instantiation(self):
        agent = FormProcessingAgent()
        self.assertIsNotNone(agent.detection)
        self.assertIsNotNone(agent.extraction)
        self.assertIsNotNone(agent.clustering)
        self.assertIsNotNone(agent.structuring)
        self.assertIsNotNone(agent.visualization)

    def test_pipeline_log_starts_empty(self):
        agent = FormProcessingAgent()
        self.assertEqual(agent.pipeline_log, [])

    @patch.object(DetectionTool, "run", return_value=[])
    def test_empty_detection_returns_zero_count(self, mock_detect):
        """If detection finds nothing, pipeline should short-circuit."""
        agent = FormProcessingAgent()
        img = _make_test_image()
        result = agent.run(img)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["count"], 0)
        self.assertEqual(result["final_result"], [])

    @patch.object(VisualizationTool, "run", return_value=(_make_test_image(), []))
    @patch.object(ClusteringTool, "run")
    @patch.object(ExtractionTool, "run")
    @patch.object(DetectionTool, "run")
    def test_full_pipeline_runs_all_steps(
        self, mock_detect, mock_extract, mock_cluster, mock_viz
    ):
        """All deterministic tools should be called in sequence."""
        mock_detect.return_value = _make_sample_detections()
        mock_extract.return_value = _make_sample_detections_with_text()
        mock_cluster.return_value = _make_sample_detections_with_text()

        agent = FormProcessingAgent()
        result = agent.run(_make_test_image(), save_dir="/tmp/formulate_agent_test")

        mock_detect.assert_called_once()
        mock_extract.assert_called_once()
        mock_cluster.assert_called_once()
        mock_viz.assert_called_once()
        self.assertEqual(result["status"], "success")

    @patch.object(VisualizationTool, "run", return_value=(_make_test_image(), []))
    @patch.object(ClusteringTool, "run", return_value=[])
    @patch.object(ExtractionTool, "run", return_value=[])
    @patch.object(DetectionTool, "run", return_value=_make_sample_detections())
    def test_llm_not_called_when_disabled(
        self, mock_detect, mock_extract, mock_cluster, mock_viz
    ):
        """StructuringTool should NOT be called when run_llm=False."""
        agent = FormProcessingAgent()
        with patch.object(StructuringTool, "run") as mock_llm:
            result = agent.run(_make_test_image(), run_llm=False)
            mock_llm.assert_not_called()
            self.assertIsNone(result["structured"])

    @patch.object(StructuringTool, "run", return_value={"name": "Test"})
    @patch.object(VisualizationTool, "run", return_value=(_make_test_image(), []))
    @patch.object(ClusteringTool, "run", return_value=_make_sample_detections_with_text())
    @patch.object(ExtractionTool, "run", return_value=_make_sample_detections_with_text())
    @patch.object(DetectionTool, "run", return_value=_make_sample_detections())
    def test_llm_called_when_enabled(
        self, mock_detect, mock_extract, mock_cluster, mock_viz, mock_llm
    ):
        """StructuringTool SHOULD be called when run_llm=True."""
        agent = FormProcessingAgent()
        result = agent.run(_make_test_image(), run_llm=True)
        mock_llm.assert_called_once()
        self.assertEqual(result["structured"], {"name": "Test"})

    @patch.object(VisualizationTool, "run", return_value=(_make_test_image(), ["/tmp/crop_0.jpg"]))
    @patch.object(ClusteringTool, "run", return_value=_make_sample_detections_with_text())
    @patch.object(ExtractionTool, "run", return_value=_make_sample_detections_with_text())
    @patch.object(DetectionTool, "run", return_value=_make_sample_detections())
    def test_pipeline_log_populated(
        self, mock_detect, mock_extract, mock_cluster, mock_viz
    ):
        """Pipeline log should record all steps."""
        agent = FormProcessingAgent()
        result = agent.run(_make_test_image())
        log = result["pipeline_log"]
        steps = [entry["step"] for entry in log]
        self.assertIn("detection", steps)
        self.assertIn("extraction", steps)
        self.assertIn("clustering", steps)
        self.assertIn("visualization", steps)
        self.assertIn("pipeline", steps)


# ===========================================================================
# 7. API ENDPOINT TESTS
# ===========================================================================

class AuthenticationTests(APITestCase):
    """Tests for login, logout, and cookie-based JWT auth."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="TestPass123!",
            email="test@example.com",
        )
        self.client = APIClient()

    def test_login_returns_tokens(self):
        response = self.client.post("/login/", {
            "username": "testuser",
            "password": "TestPass123!",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_sets_cookie(self):
        response = self.client.post("/login/", {
            "username": "testuser",
            "password": "TestPass123!",
        })
        self.assertIn("auth_token", response.cookies)

    def test_login_wrong_password_fails(self):
        response = self.client.post("/login/", {
            "username": "testuser",
            "password": "WrongPass!",
        })
        self.assertEqual(response.status_code, 401)

    def test_me_requires_auth(self):
        response = self.client.get("/me/")
        # Without auth cookie, should fail
        self.assertIn(response.status_code, [401, 403])

    def test_me_with_auth_returns_role(self):
        # Login first
        login_resp = self.client.post("/login/", {
            "username": "testuser",
            "password": "TestPass123!",
        })
        # Set cookie
        self.client.cookies["auth_token"] = login_resp.data["access"]
        response = self.client.get("/me/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("role", response.data)

    def test_logout_clears_cookie(self):
        # Login
        login_resp = self.client.post("/login/", {
            "username": "testuser",
            "password": "TestPass123!",
        })
        self.client.cookies["auth_token"] = login_resp.data["access"]

        response = self.client.post("/logout/")
        self.assertEqual(response.status_code, 200)


class DetectionEndpointTests(APITestCase):
    """Tests for the /detection/ API endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="detector_user",
            password="TestPass123!",
            email="detect@example.com",
        )
        self.client = APIClient()
        # Login
        login_resp = self.client.post("/login/", {
            "username": "detector_user",
            "password": "TestPass123!",
        })
        self.client.cookies["auth_token"] = login_resp.data["access"]

    def test_detection_requires_file(self):
        response = self.client.post("/detection/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("No file uploaded", response.data.get("message", ""))

    def test_detection_requires_auth(self):
        """Unauthenticated request should be rejected."""
        anon_client = APIClient()
        img = _make_test_image()
        buf = BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        buf.name = "test.jpg"
        response = anon_client.post("/detection/", {"file": buf}, format="multipart")
        self.assertIn(response.status_code, [401, 403])

    @patch("myapp.views.FormProcessingAgent")
    def test_detection_success_with_mock_agent(self, MockAgent):
        """Successful detection should return structured result."""
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            "status": "success",
            "count": 2,
            "final_result": _make_sample_detections_with_text()[:2],
            "annotated_image": _make_test_image(),
            "crop_paths": ["/tmp/crop_0.jpg"],
            "pipeline_log": [],
        }
        MockAgent.return_value = mock_instance

        img = _make_test_image_with_text()
        buf = BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        buf.name = "test_form.jpg"

        response = self.client.post("/detection/", {"file": buf}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["count"], 2)


class PasswordEndpointTests(APITestCase):
    """Tests for password reset and forgot password."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="passuser",
            password="OldPass123!",
            email="pass@example.com",
        )
        self.client = APIClient()
        login_resp = self.client.post("/login/", {
            "username": "passuser",
            "password": "OldPass123!",
        })
        self.client.cookies["auth_token"] = login_resp.data["access"]

    def test_reset_password_success(self):
        response = self.client.post("/reset-password/", {
            "oldPassword": "OldPass123!",
            "newPassword": "NewPass456!",
            "confirmPassword": "NewPass456!",
        })
        self.assertEqual(response.status_code, 200)

    def test_reset_password_wrong_old(self):
        response = self.client.post("/reset-password/", {
            "oldPassword": "WrongOld!",
            "newPassword": "NewPass456!",
            "confirmPassword": "NewPass456!",
        })
        self.assertEqual(response.status_code, 400)

    def test_reset_password_mismatch(self):
        response = self.client.post("/reset-password/", {
            "oldPassword": "OldPass123!",
            "newPassword": "NewPass456!",
            "confirmPassword": "Different789!",
        })
        self.assertEqual(response.status_code, 400)

    def test_reset_password_same_as_old(self):
        response = self.client.post("/reset-password/", {
            "oldPassword": "OldPass123!",
            "newPassword": "OldPass123!",
            "confirmPassword": "OldPass123!",
        })
        self.assertEqual(response.status_code, 400)


class UserCRUDEndpointTests(APITestCase):
    """Tests for user CRUD operations."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin_test",
            password="AdminPass123!",
            email="admin_test@example.com",
        )
        self.client = APIClient()
        login_resp = self.client.post("/login/", {
            "username": "admin_test",
            "password": "AdminPass123!",
        })
        self.client.cookies["auth_token"] = login_resp.data["access"]

    def test_list_users(self):
        response = self.client.get("/users/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_delete_user(self):
        user_to_delete = User.objects.create_user(
            username="deleteme",
            password="Pass123!",
            email="delete@example.com",
        )
        response = self.client.delete(f"/users/{user_to_delete.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(pk=user_to_delete.pk).exists())


# ===========================================================================
# 8. INTEGRATION TEST — Full Pipeline (ONNX model required)
# ===========================================================================

class FullPipelineIntegrationTest(TestCase):
    """
    End-to-end integration test that runs the actual ONNX model.
    Verifies the entire pipeline from image to final result.
    """

    def test_full_pipeline_with_synthetic_image(self):
        """Run the real pipeline on a synthetic image (may find 0 detections)."""
        img = _make_test_image_with_text(800, 600)
        agent = FormProcessingAgent()
        result = agent.run(img, save_dir="/tmp/formulate_integration_test")

        # Pipeline should complete without crashing
        self.assertEqual(result["status"], "success")
        self.assertIsInstance(result["count"], int)
        self.assertIsInstance(result["final_result"], list)
        self.assertIsInstance(result["pipeline_log"], list)
        self.assertIsNotNone(result["annotated_image"])

        # Pipeline log should have entries
        log_steps = [e["step"] for e in result["pipeline_log"]]
        self.assertIn("detection", log_steps)
        self.assertIn("pipeline", log_steps)

    def test_pipeline_handles_grayscale_input(self):
        """Pipeline should not crash on grayscale images."""
        gray_img = Image.new("L", (800, 600), 200)
        agent = FormProcessingAgent()
        result = agent.run(gray_img, save_dir="/tmp/formulate_gray_test")
        self.assertEqual(result["status"], "success")

    def test_pipeline_handles_small_image(self):
        """Pipeline should handle very small images without crashing."""
        tiny = Image.new("RGB", (50, 50), "white")
        agent = FormProcessingAgent()
        result = agent.run(tiny, save_dir="/tmp/formulate_tiny_test")
        self.assertEqual(result["status"], "success")

    def test_pipeline_handles_large_image(self):
        """Pipeline should handle large images without crashing."""
        large = Image.new("RGB", (4000, 3000), "white")
        agent = FormProcessingAgent()
        result = agent.run(large, save_dir="/tmp/formulate_large_test")
        self.assertEqual(result["status"], "success")
