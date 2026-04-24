# detection.py — YOLO model inference, preprocessing, and NMS
import os
import logging
import numpy as np
from pathlib import Path
from PIL import Image

logger = logging.getLogger(__name__)

_BASE_DIR = Path(__file__).resolve().parent.parent.parent

_default_model_path = _BASE_DIR / "Backend" / "models" / "weights" / "weights.onnx"
_env_model_path = os.getenv("MODEL_PATH")

if _env_model_path:
    # If set, resolve the path
    _candidate = Path(_env_model_path) if os.path.isabs(_env_model_path) else _BASE_DIR / _env_model_path
    if _candidate.exists():
        MODEL_PATH = str(_candidate)
    else:
        MODEL_PATH = str(_default_model_path)
else:
    MODEL_PATH = str(_default_model_path)

_session = None


def get_session():
    """Lazily load the ONNX model and cache the session."""
    global _session
    if _session is None:
        if not MODEL_PATH:
            raise ValueError("MODEL_PATH environment variable is not set")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
        import onnxruntime as ort

        _session = ort.InferenceSession(MODEL_PATH)
        logger.info("ONNX model loaded from %s", MODEL_PATH)
    return _session


# ---------------------
# Image preprocessing
# ---------------------

def letterbox(img: Image.Image, new_size=640, color=(114, 114, 114)):
    """
    Resize image with aspect-ratio preservation + padding to target square.

    Returns:
        (canvas, scale, pad_left, pad_top)
    """
    w, h = img.size
    scale = min(new_size / w, new_size / h)

    nw, nh = int(w * scale), int(h * scale)
    img_resized = img.resize((nw, nh))

    pad_w = new_size - nw
    pad_h = new_size - nh
    pad_left = pad_w // 2
    pad_top = pad_h // 2

    canvas = Image.new("RGB", (new_size, new_size), color)
    canvas.paste(img_resized, (pad_left, pad_top))

    return canvas, scale, pad_left, pad_top


def preprocess(img: Image.Image, imgsz=640) -> tuple:
    """
    Prepare image for YOLO inference.

    Returns:
        (input_array, scale, pad_x, pad_y)
    """
    if img.mode != "RGB":
        img = img.convert("RGB")

    img_lb, scale, pad_x, pad_y = letterbox(img, imgsz)

    arr = np.array(img_lb, dtype=np.float32) / 255.0   # (640, 640, 3)
    arr = np.transpose(arr, (2, 0, 1))                  # (3, 640, 640)
    arr = np.expand_dims(arr, 0)                         # (1, 3, 640, 640)

    return arr, scale, pad_x, pad_y


# ------------------------------
# NMS (Non-Maximum Suppression)
# ------------------------------

def nms(boxes: np.ndarray, scores: np.ndarray, iou_thresh=0.45) -> list:
    """Greedy NMS — returns list of kept indices."""
    idxs = np.argsort(scores)[::-1]
    keep = []

    while len(idxs) > 0:
        i = idxs[0]
        keep.append(i)
        if len(idxs) == 1:
            break

        xx1 = np.maximum(boxes[i][0], boxes[idxs[1:], 0])
        yy1 = np.maximum(boxes[i][1], boxes[idxs[1:], 1])
        xx2 = np.minimum(boxes[i][2], boxes[idxs[1:], 2])
        yy2 = np.minimum(boxes[i][3], boxes[idxs[1:], 3])

        inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
        area_i = (boxes[i][2] - boxes[i][0]) * (boxes[i][3] - boxes[i][1])
        area_j = (boxes[idxs[1:], 2] - boxes[idxs[1:], 0]) * (
            boxes[idxs[1:], 3] - boxes[idxs[1:], 1]
        )

        iou = inter / (area_i + area_j - inter + 1e-6)
        idxs = idxs[1:][iou < iou_thresh]

    return keep


# ----------------------------
# Detection output formatting
# ----------------------------

def format_detections(
    outputs, image_size, scale, pad_x, pad_y, conf_thresh=0.01, iou_thresh=0.50
) -> list:
    """
    Parse YOLOv11 ONNX output and transform coordinates to original image space.

    YOLOv11 outputs: [batch, 4+num_classes, num_predictions]
    - First 4 rows: x_center, y_center, width, height (in letterbox 640×640 space)
    - Remaining rows: class scores (no objectness score in YOLOv8/v11)
    """
    orig_w, orig_h = image_size

    output_data = outputs[0][0] if len(outputs[0].shape) == 3 else outputs[0]

    logger.debug("Model output shape: %s", outputs[0].shape)

    # Auto-detect format: if dim-0 < dim-1, data needs transposing
    if len(output_data.shape) == 2 and output_data.shape[0] < output_data.shape[1]:
        preds = output_data.T
        logger.debug("Transposed predictions shape: %s", preds.shape)
    else:
        preds = output_data
        logger.debug("Predictions shape (no transpose): %s", preds.shape)

    boxes, scores, classes = [], [], []
    num_classes = 6

    if preds.size == 0:
        return []

    for det in preds:
        x_center, y_center, w, h = det[:4]
        cls_scores = det[4 : 4 + num_classes]

        cls_id = np.argmax(cls_scores)
        conf = cls_scores[cls_id]

        if conf < conf_thresh:
            continue

        # Center-format → corner-format in letterbox space
        x1_lb = x_center - w / 2
        y1_lb = y_center - h / 2
        x2_lb = x_center + w / 2
        y2_lb = y_center + h / 2

        # Remove padding and scale back to original image size
        x1 = (x1_lb - pad_x) / scale
        y1 = (y1_lb - pad_y) / scale
        x2 = (x2_lb - pad_x) / scale
        y2 = (y2_lb - pad_y) / scale

        # Clip to image boundaries
        x1 = max(0, min(x1, orig_w))
        y1 = max(0, min(y1, orig_h))
        x2 = max(0, min(x2, orig_w))
        y2 = max(0, min(y2, orig_h))

        boxes.append([x1, y1, x2, y2])
        scores.append(conf)
        classes.append(cls_id)

    if not boxes:
        return []

    boxes = np.array(boxes)
    scores = np.array(scores)

    logger.debug("Detections before NMS: %d", len(boxes))
    keep = nms(boxes, scores, iou_thresh)
    logger.debug("Detections after NMS: %d", len(keep))

    detections = []
    for i in keep:
        detections.append(
            {
                "bbox": boxes[i].tolist(),
                "confidence": float(scores[i]),
                "class": int(classes[i]),
            }
        )

    return detections
