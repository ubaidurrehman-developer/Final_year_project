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


import concurrent.futures

# --------------------
# OCR text extraction
# --------------------

def _process_single_crop(det, image_np):
    x1, y1, x2, y2 = map(int, det["bbox"])
    crop = image_np[y1:y2, x1:x2]

    if crop.size == 0:
        det["text"] = ""
        return

    text = pytesseract.image_to_string(crop, config="--psm 7").strip()
    lines = text.split("\n")
    from .cleaning import clean_ocr_text
    cleaned_lines = clean_ocr_text(lines)
    det["text"] = " ".join(cleaned_lines)

def add_text_to_detections(detections: list, image: Image.Image) -> list:
    """Run Tesseract OCR on each detection crop and attach the text in parallel."""
    if not detections:
        return detections

    image_np = np.array(image)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(_process_single_crop, det, image_np) for det in detections]
        concurrent.futures.wait(futures)

    return detections


# -------------------------
# Visualization & cropping
# -------------------------

def visualize_and_crop(
    img: Image.Image, detections: list, save_dir="crops"
) -> tuple:
    """
    Draw bounding boxes on the image and save individual crops.

    Returns:
        (annotated_image, list_of_crop_paths)
    """
    os.makedirs(save_dir, exist_ok=True)
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)
    width, height = img.size

    crop_paths = []
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

        crop = img.crop((x1, y1, x2, y2))
        crop_path = os.path.join(save_dir, f"crop_{i}.jpg")
        crop.save(crop_path)
        crop_paths.append(crop_path)

    logger.info("Saved %d crops to %s", len(crop_paths), save_dir)
    return img, crop_paths
