# agents.py — Hybrid Orchestrator Agent for form processing pipeline
#
# Architecture:
#   ┌─────────────────────────────────────────────────┐
#   │            FormProcessingAgent (Orchestrator)   │
#   │                                                 │
#   │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
#   │  │Detection │→ │Extraction│→ │  Clustering  │   │
#   │  │  Tool    │  │   Tool   │  │    Tool      │   │
#   │  └──────────┘  └──────────┘  └──────────────┘   │
#   │                                    ↓            │
#   │  ┌──────────────┐  ┌──────────────────────┐     │
#   │  │Visualization │  │ Structuring Tool (LLM)│    │
#   │  │    Tool      │  │   (optional)          │    │
#   │  └──────────────┘  └──────────────────────┘     │
#   └─────────────────────────────────────────────────┘
#
# - Steps 1-3, 5 are deterministic (no LLM cost).
# - Step 4 (Structuring) is the LLM-powered agent — only invoked when needed.

import logging
import time
from PIL import Image

from .detection import get_session, preprocess, format_detections
from .extraction import pixel_tighten_detections, add_text_to_detections, visualize
from .clustering import clusters_formation
from .llm_parser import parse_to_json

logger = logging.getLogger(__name__)

class DetectionTool:
    """Runs YOLO model on a preprocessed image to detect form elements."""
    name = "detect_form_elements"

    def run(self, image: Image.Image) -> list:
        input_data, scale, pad_x, pad_y = preprocess(image)
        session = get_session()
        outputs = session.run(None, {session.get_inputs()[0].name: input_data})
        detections = format_detections(outputs, image.size, scale, pad_x, pad_y)
        logger.info("[%s] %d raw detections", self.name, len(detections))
        return detections


class ExtractionTool:
    """Refines bounding boxes and extracts text via Tesseract OCR."""
    name = "extract_text"

    def run(self, image: Image.Image, detections: list) -> list:
        detections = pixel_tighten_detections(image, detections)
        detections = add_text_to_detections(detections, image)
        logger.info("[%s] Extracted text from %d detections", self.name, len(detections))
        return detections


class ClusteringTool:
    """Groups related form elements (checkboxes ↔ labels)."""
    name = "cluster_form_elements"

    def run(self, detections: list) -> list:
        clusters = clusters_formation(detections)
        logger.info("[%s] %d clusters formed", self.name, len(clusters))
        return clusters


class StructuringTool:
    """Uses LLM (OpenRouter) to convert detections into structured JSON."""
    name = "structure_with_llm"

    def run(self, detections: list) -> dict:
        result = parse_to_json(detections)
        logger.info("[%s] LLM structuring complete", self.name)
        return result


class VisualizationTool:
    """Creates an annotated image."""
    name = "visualize_results"

    def run(self, image: Image.Image, detections: list) -> Image.Image:
        annotated_img = visualize(image, detections)
        logger.info("[%s] Annotated image created", self.name)
        return annotated_img


class FormProcessingAgent:
    """
    Hybrid orchestrator for the form-processing pipeline.

    Deterministic steps (no LLM cost):
        1. DetectionTool     — YOLO inference
        2. ExtractionTool    — box refinement + OCR
        3. ClusteringTool    — checkbox–label grouping

    LLM-powered step (optional, on demand):
        4. StructuringTool   — convert to structured JSON via OpenRouter

    Always runs:
        5. VisualizationTool — annotated image + crops
    """

    def __init__(self):
        self.detection = DetectionTool()
        self.extraction = ExtractionTool()
        self.clustering = ClusteringTool()
        self.structuring = StructuringTool()
        self.visualization = VisualizationTool()
        self.pipeline_log = []

    # -- helpers ---------------------------------------------------------------

    def _log_step(self, step: str, status: str, detail: str = ""):
        entry = {
            "step": step,
            "status": status,
            "detail": detail,
            "ts": time.time(),
        }
        self.pipeline_log.append(entry)
        logger.info("Pipeline [%s] %s — %s", step, status, detail)

    # -- main entry point ------------------------------------------------------

    def run(
        self,
        image: Image.Image,
        run_llm: bool = False,
    ) -> dict:
        """
        Execute the full form-processing pipeline.

        Args:
            image:    PIL Image of the uploaded form.
            run_llm:  If True, also invoke the LLM structuring step.

        Returns:
            dict with keys: status, count, final_result, structured (if LLM),
            annotated_image, pipeline_log.
        """
        self.pipeline_log = []
        t0 = time.time()

        # --- Step 1: Detection ------------------------------------------------
        self._log_step("detection", "started")
        detections = self.detection.run(image)
        self._log_step(
            "detection", "completed", f"{len(detections)} elements detected"
        )

        if not detections:
            self._log_step("pipeline", "completed", "No elements detected")
            return {
                "status": "success",
                "count": 0,
                "final_result": [],
                "pipeline_log": self.pipeline_log,
            }

        # --- Step 2: Extraction (box refinement + OCR) -----------------------
        self._log_step("extraction", "started")
        detections = self.extraction.run(image, detections)
        self._log_step(
            "extraction", "completed",
            f"{len(detections)} elements with text",
        )

        # --- Step 3: Clustering -----------------------------------------------
        self._log_step("clustering", "started")
        final_results = self.clustering.run(detections)
        self._log_step(
            "clustering", "completed", f"{len(final_results)} clusters"
        )

        # --- Step 4: LLM Structuring (optional) ------------------------------
        structured = None
        if run_llm:
            self._log_step("structuring", "started")
            structured = self.structuring.run(final_results)
            self._log_step("structuring", "completed")

        # --- Step 5: Visualization --------------------------------------------
        self._log_step("visualization", "started")
        valid_results = [d for d in final_results if d.get("bbox") is not None]
        annotated_img = self.visualization.run(
            image.copy(), valid_results
        )
        self._log_step(
            "visualization", "completed"
        )

        elapsed = round(time.time() - t0, 2)
        self._log_step("pipeline", "completed", f"Total: {elapsed}s")

        return {
            "status": "success",
            "count": len(final_results),
            "final_result": final_results,
            "structured": structured,
            "annotated_image": annotated_img,
            "pipeline_log": self.pipeline_log,
        }