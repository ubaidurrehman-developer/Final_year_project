# extraction.py — Bounding-box refinement, cropping, and OCR text extraction
import os
import logging
import numpy as np
import cv2
import pytesseract
from PIL import Image, ImageDraw

from .cleaning import clean_ocr_text

logger = logging.getLogger(__name__)


# ---------------------
# Bounding-box helpers
# ---------------------

def expand_box(bbox, img: Image.Image, pad=3):
    """Expand a bounding box by `pad` pixels, clamped to image bounds."""
    x1, y1, x2, y2 = bbox
    w, h = img.size
    return [
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(w, x2 + pad),
        min(h, y2 + pad),
    ]


def refine_box_with_image(img: Image.Image, bbox, pad=2):
    """
    Use contour analysis to tighten a bounding box around actual content.

    Args:
        img: Full PIL Image (RGB).
        bbox: [x1, y1, x2, y2] in image coordinates.
        pad: Extra padding around the refined box.

    Returns:
        Refined [x1, y1, x2, y2].
    """
    x1, y1, x2, y2 = map(int, bbox)
    crop = img.crop((x1, y1, x2, y2))
    crop_np = np.array(crop)

    if len(crop_np.shape) == 2 or crop_np.shape[2] == 1:
        gray = crop_np if len(crop_np.shape) == 2 else crop_np[:, :, 0]
    else:
        gray = cv2.cvtColor(crop_np, cv2.COLOR_RGB2GRAY)

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return bbox  # fallback — no content found

    cnt = np.vstack(contours)
    rx, ry, rw, rh = cv2.boundingRect(cnt)

    w, h = img.size

    x1n = max(0, x1 + rx - pad)
    y1n = max(0, y1 + ry - pad)
    x2n = min(w, x1 + rx + rw + pad)
    y2n = min(h, y1 + ry + rh + pad)

    return [x1n, y1n, x2n, y2n]


# ---------------------
# Detection refinement
# ---------------------

def pixel_tighten_detections(img: Image.Image, detections: list, y_thresh=20) -> list:
    """
    Expand → contour-refine each detection box, then sort top-to-bottom,
    left-to-right (quantized by y_thresh).
    """
    refined = []
    for d in detections:
        padded = expand_box(d["bbox"], img, pad=3)
        tight = refine_box_with_image(img, padded)
        refined.append({**d, "bbox": tight})

    return sorted(
        refined,
        key=lambda d: (d["bbox"][1] // y_thresh, d["bbox"][0]),
    )


# --------------------
# OCR text extraction
# --------------------

def add_text_to_detections(detections: list, image: Image.Image) -> list:
    """Run Tesseract OCR once on the entire image and match text to bounding boxes."""
    if not detections:
        return detections

    image_np = np.array(image)
    if len(image_np.shape) == 2 or image_np.shape[2] == 1:
        gray = image_np if len(image_np.shape) == 2 else image_np[:, :, 0]
    else:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)

    # Run OCR once on the entire image to get text and coordinates
    ocr_data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
    
    words = []
    n_boxes = len(ocr_data['text'])
    for i in range(n_boxes):
        text = ocr_data['text'][i].strip()
        conf = ocr_data['conf'][i]
        # conf can be a string sometimes, or negative if empty
        if text and int(conf) > 0:
            wx1 = ocr_data['left'][i]
            wy1 = ocr_data['top'][i]
            wx2 = wx1 + ocr_data['width'][i]
            wy2 = wy1 + ocr_data['height'][i]
            words.append((wx1, wy1, wx2, wy2, text))

    from .cleaning import clean_ocr_text

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        det_words = []
        for wx1, wy1, wx2, wy2, text in words:
            # Check intersection
            ix1 = max(x1, wx1)
            iy1 = max(y1, wy1)
            ix2 = min(x2, wx2)
            iy2 = min(y2, wy2)
            
            if ix2 > ix1 and iy2 > iy1:
                inter_area = (ix2 - ix1) * (iy2 - iy1)
                word_area = (wx2 - wx1) * (wy2 - wy1)
                # If word is largely inside the detection (e.g. > 30%)
                if inter_area / word_area > 0.3:
                    det_words.append(text)
                    
        raw_text = " ".join(det_words)
        cleaned_lines = clean_ocr_text([raw_text])
        det["text"] = " ".join(cleaned_lines)

    return detections


# -------------------------
# Visualization
# -------------------------

def visualize(
    img: Image.Image, detections: list
) -> Image.Image:
    """
    Draw bounding boxes on the image.

    Returns:
        annotated_image
    """
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)
    width, height = img.size

    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det["bbox"]

        # Clamp to image bounds
        x1 = max(0, min(x1, width))
        y1 = max(0, min(y1, height))
        x2 = max(0, min(x2, width))
        y2 = max(0, min(y2, height))

        det["bbox"] = [x1, y1, x2, y2]
        if x2 <= x1 or y2 <= y1:
            continue

        draw.rectangle([x1, y1, x2, y2], outline="red", width=2)

    return img
