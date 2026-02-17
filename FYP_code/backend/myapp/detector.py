# detector.py
from PIL import Image, ImageDraw
import numpy as np
import onnxruntime as ort
import os
import cv2

MODEL_PATH = os.getenv("MODEL_PATH")
session = ort.InferenceSession(MODEL_PATH)


def letterbox(img, new_size=640, color=(114, 114, 114)):
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


def visualize_and_Crop(img: Image.Image, detections: list, save_dir: "crops"):
    import os

    os.makedirs(save_dir, exist_ok=True)
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)
    width, height = img.size

    crop_paths = []
    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det["bbox"]

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
    return img, crop_paths


def refine_box_with_image(img, bbox, pad=2):
    """
    img: PIL Image (RGB)
    bbox: [x1, y1, x2, y2]
    """
    x1, y1, x2, y2 = map(int, bbox)
    crop = img.crop((x1, y1, x2, y2))
    crop_np = np.array(crop)

    gray = cv2.cvtColor(crop_np, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255,cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return bbox  # fallback

    cnt = np.vstack(contours)
    rx, ry, rw, rh = cv2.boundingRect(cnt)

    h, w = img.size[1], img.size[0]

    x1n = max(0, x1 + rx - pad)
    y1n = max(0, y1 + ry - pad)
    x2n = min(w, x1 + rx + rw + pad)
    y2n = min(h, y1 + ry + rh + pad)

    return [x1n, y1n, x2n, y2n]



# ( for grouping detections )
# def pixel_tighten_detections(img, detections, y_thresh=20):
#     refined = []
#     for d in detections:
#         tight = refine_box_with_image(img, d["bbox"])
#         refined.append({**d, "bbox": tight})

#     return sorted(
#         refined,
#         key=lambda d: (
#             int(((d["bbox"][1] + d["bbox"][3]) / 2) // y_thresh),  # y_center
#             d["bbox"][0]  # x1
#         )
#     )

def expand_box(bbox, img, pad=3):
    x1, y1, x2, y2 = bbox
    w, h = img.size
    return [
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(w, x2 + pad),
        min(h, y2 + pad),
    ]

def pixel_tighten_detections(img, detections, y_thresh=20):
    refined = []
    for d in detections:
        padded = expand_box(d["bbox"], img, pad=3)
        tight = refine_box_with_image(img, padded)
        refined.append({**d, "bbox": tight})

    return sorted(
        refined,
        key=lambda d: (d["bbox"][1] // y_thresh, d["bbox"][0])
    )



def format_detections(
    outputs, image_size, scale, pad_x, pad_y, conf_thresh=0.05, iou_thresh=0.30
):
    """
    Parse YOLOv11 ONNX output and transform coordinates to original image space.

    YOLOv11 outputs: [batch, 4+num_classes, num_predictions]
    - First 4 rows: x_center, y_center, width, height (in letterbox 640x640 space)
    - Remaining rows: class scores (NO objectness score in YOLOv8/v11)

    Output needs to be transposed to [num_predictions, 4+num_classes]
    """

    orig_w, orig_h = image_size

    # YOLOv11 Instance Segmentation can output different shapes:
    # Option 1: [1, 300, 38] - already in [batch, predictions, values] format
    # Option 2: [1, 42, 8400] - in [batch, values, predictions] format - needs transpose

    output_data = outputs[0][0] if len(outputs[0].shape) == 3 else outputs[0]

    print(f"[DEBUG] Model output shape: {outputs[0].shape}")

    # Auto-detect format: if second dimension > first, it's transposed
    if len(output_data.shape) == 2 and output_data.shape[0] < output_data.shape[1]:
        # Shape is (42, 8400) - transpose to (8400, 42)
        preds = output_data.T
        print(f"[DEBUG] Transposed predictions shape: {preds.shape}")
    else:
        # Shape is already (300, 38) - use as-is
        preds = output_data
        print(f"[DEBUG] Predictions shape (no transpose): {preds.shape}")

    print(
    "x_center range:",
    np.min(preds[:, 0]),
    np.max(preds[:, 0])
)

    boxes, scores, classes = [], [], []

    for det in preds:
        # Instance Seg format: [x, y, w, h, class1_score, ..., class6_score, mask_coef1, ...]
        x_center, y_center, w, h = det[:4]

        # Next 6 values are class scores (ignore mask coefficients beyond that)
        num_classes = 6
        cls_scores = det[4 : 4 + num_classes]

        cls_id = np.argmax(cls_scores)
        conf = cls_scores[cls_id]  # Direct class confidence (no objectness multiplier)

        if conf < conf_thresh:
            continue

        # Convert from letterbox coordinates to original image coordinates
        # First, convert center format to corner format in letterbox space
        x1_letterbox = x_center - w / 2
        y1_letterbox = y_center - h / 2
        x2_letterbox = x_center + w / 2
        y2_letterbox = y_center + h / 2

        # Then remove padding and scale back to original image size
        x1 = (x1_letterbox - pad_x) / scale
        y1 = (y1_letterbox - pad_y) / scale
        x2 = (x2_letterbox - pad_x) / scale
        y2 = (y2_letterbox - pad_y) / scale

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

    print(f"[DEBUG] Detections before NMS: {len(boxes)}")

    keep = nms(boxes, scores, iou_thresh)

    print(f"[DEBUG] Detections after NMS: {len(keep)}")

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


def nms(boxes, scores, iou_thresh=0.45):
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


def preprocess(img: Image.Image, imgsz=640) -> np.ndarray:
    if img.mode != "RGB":
        img = img.convert("RGB")

    img = img.convert("RGB")
    img_lb, scale, pad_x, pad_y = letterbox(img, imgsz)

    arr = np.array(img_lb, dtype=np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))
    arr = np.expand_dims(arr, 0)

    return arr, scale, pad_x, pad_y
