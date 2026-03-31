# detector.py
from PIL import Image, ImageDraw
import pytesseract
import numpy as np
import onnxruntime as ort

import os, cv2, re

MODEL_PATH = os.getenv("MODEL_PATH")
session = ort.InferenceSession(MODEL_PATH)


def preprocess(img: Image.Image, imgsz=640) -> np.ndarray:
    
    # Technical Issue (YOLO side)
    if img.mode != "RGB":
        img = img.convert("RGB")

    img_lb, scale, pad_x, pad_y = letterbox(img, imgsz)

    arr = np.array(img_lb, dtype=np.float32) / 255.0    # (640, 640, 3) height, width, channels
    arr = np.transpose(arr, (2, 0, 1))                  # (3, 640, 640)
    arr = np.expand_dims(arr, 0)                        # (1, 3, 640, 640) 1->batch

    return arr, scale, pad_x, pad_y

def letterbox(img, new_size=640, color=(114, 114, 114)):
    
    # Find width, height of image.
    w, h = img.size
    scale = min(new_size / w, new_size / h)

    # Resize image by scale number.
    nw, nh = int(w * scale), int(h * scale)
    img_resized = img.resize((nw, nh))

    # Finding padding_values to archieve target size.
    pad_w = new_size - nw
    pad_h = new_size - nh
    pad_left = pad_w // 2
    pad_top = pad_h // 2

    # Image Creation
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

    if len(crop_np.shape) == 2 or crop_np.shape[2] == 1:
        gray = crop_np if len(crop_np.shape) == 2 else crop_np[:, :, 0]
    else:
        gray = cv2.cvtColor(crop_np, cv2.COLOR_RGB2GRAY)

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
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

def expand_box(bbox, img, pad=3):
    x1, y1, x2, y2 = bbox
    w, h = img.size
    return [
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(w, x2 + pad),
        min(h, y2 + pad),
    ]

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




# 0-------(    Just for tesing bugs    )-------0

# def debug_raw_detections(img_file, detections):
#     # Handle both Django UploadedFile objects and file path strings
#     if hasattr(img_file, "read"):
#         img_file.seek(0)
#         file_bytes = np.asarray(bytearray(img_file.read()), dtype=np.uint8)
#         img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
#         img_file.seek(0)  # Reset so the file can be read again later
#     else:
#         img = cv2.imread(img_file)

#     for d in detections:
#         bbox = d["bbox"]
#         x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
        
#         cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
#         label = f'class {d["class"]} ({d["confidence"]:.2f})'
#         cv2.putText(img, label, (x1, y1-5),
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    
#     cv2.imwrite("debug_raw.jpg", img)

# 0-------(    for grouping detections    )-------0

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


# 0-------(    Form Grouper    )-------0

# Logic:
#     1. Separate detections into input_labels and checkboxes
#     2. For each checkbox, find the input_label immediately to its right → this is an OPTION
#     3. Any input_label that was NOT paired with a checkbox → this is a GROUP LABEL
#     4. Group each label with the options that are nearby (by Y position)

# Your YOLO class names — adjust index if needed
CLASS_NAMES = ['input_label', 'checkboxes', 'table', 'text', 'image', 'bbox']

# Class IDs (index in CLASS_NAMES)
INPUT_LABEL_ID = 3
CHECKBOX_ID    = 1
TEXT_ID = 5

def get_center(bbox):
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)

def add_text_to_detections(detections, image):
    if not detections:
        return detections

    image_np = np.array(image)
    
    for det in detections:
        x1, y1, x2, y2 = map(int, det['bbox'])
        crop = image_np[y1:y2, x1:x2]

        if crop.size == 0:
            det['text'] = ''
            continue

        # Use pytesseract to extract text from the crop
        text = pytesseract.image_to_string(crop, config='--psm 7').strip()
        lines = text.split('\n')
        cleaned_lines = clean_ocr_text(lines)
        det['text'] = " ".join(cleaned_lines)

    return detections

def clean_ocr_text(raw_text_list: list) -> list:
    if not raw_text_list:
        return []

    WORD_FIXES = {
        r'\bAdyvisor\b':   'Advisor',
        r'\bRo11\b':       'Roll',
        r'\bDlscipline\b': 'Discipline',
        r'\bSernester\b':  'Semester',
        r'\bSlgnature\b':  'Signature',
        r'\bApprovéd\b':   'Approved',
        r'\bN0\b':         'No',
        r'\bl\b':          'I',
        r'\b1\b':          'I',
    }

    cleaned_list = []
    for item in raw_text_list:
        if not item:
            continue
        
        # Applying the original cleaning logic
        text = re.sub(r'[[\]|{}:;\u2012-\u2015-]', '', item)     # remove unwanted brackets etc.
        text = re.sub(r'\s+', ' ', text)                         # normalize spaces
        text = re.sub(r'\b(?!s\))([a-zA-Z0-9])\b', '', text)
        text = re.sub(r'[.\'"]+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        for pattern, correct in WORD_FIXES.items():
            text = re.sub(pattern, correct, text, flags=re.IGNORECASE)
        
        if text:
            cleaned_list.append(text)

    return cleaned_list

def clusters_formation(detections):
    # Separate checkboxes and labels from detections
    checkboxes = [d for d in detections if d['class'] == CHECKBOX_ID]
    input_labels = [d for d in detections if d['class'] == INPUT_LABEL_ID]
    
    # 1. Pair each checkbox with its immediate label (option)
    # Using the logic requested: y1 difference <= 5
    options_pairs = []
    used_checkbox_idx = set()
    used_label_idx = set()

    for i, chk in enumerate(checkboxes):
        chk_y1 = chk['bbox'][1]
        chk_x1 = chk['bbox'][0]
        
        best_label_idx = None
        min_y_diff = float('inf')
        
        for j, label in enumerate(input_labels):
            if j in used_label_idx:
                continue
            
            label_y1 = label['bbox'][1]
            label_x1 = label['bbox'][0]
            
            y_diff = abs(chk_y1 - label_y1)
            
            # Pairing rule: Same line (y1 diff <= 5) and checkbox is at the left
            # We allow some overlap/closeness horizontally (up to 150 pixels)
            if y_diff <= 5 and chk_x1 < label_x1 and (label_x1 - chk['bbox'][2]) < 100:
                if y_diff < min_y_diff:
                    min_y_diff = y_diff
                    best_label_idx = j
        
        if best_label_idx is not None:
            options_pairs.append({
                "checkbox": chk,
                "option_label": input_labels[best_label_idx]
            })
            used_checkbox_idx.add(i)
            used_label_idx.add(best_label_idx)

    # 2. Identify potential Parent Labels (labels not used as options)
    remaining_labels = [lbl for i, lbl in enumerate(input_labels) if i not in used_label_idx]
    
    # 3. Group options under Parent Labels
    grouped_results = []
    used_option_pair_idx = set()
    used_parent_label_idx = set()

    for i, parent in enumerate(remaining_labels):
        parent_bbox = parent['bbox']
        parent_y1 = parent_bbox[1]
        parent_x2 = parent_bbox[2]
        parent_text = parent.get('text', '').strip()
        if not parent_text:
            continue

        group_options = []
        for j, pair in enumerate(options_pairs):
            if j in used_option_pair_idx:
                continue
            
            opt_label = pair['option_label']
            opt_bbox = opt_label['bbox']
            opt_y1 = opt_bbox[1]
            opt_x1 = pair['checkbox']['bbox'][0]
            
            # Same line: Parent to the left
            same_line = abs(parent_y1 - opt_y1) <= 10 and parent_x2 < opt_x1
            
            # Parent is above the options (vertical list)
            parent_above = 0 < (opt_y1 - parent_bbox[3]) < 150 and abs(parent_bbox[0] - opt_x1) < 200

            if same_line or parent_above:
                group_options.append(opt_label.get('text', ''))
                used_option_pair_idx.add(j)

        if group_options:
            grouped_results.append({
                "bbox": parent_bbox,
                "options": group_options,
                "label": parent_text
            })
            used_parent_label_idx.add(i)

    # 4. Final collection of results
    final_output = []
    final_output.extend(grouped_results)
    
    # Add anything that wasn't grouped
    for i, parent in enumerate(remaining_labels):
        if i not in used_parent_label_idx:
            final_output.append(parent)
            
    for j, pair in enumerate(options_pairs):
        if j not in used_option_pair_idx:
            final_output.append(pair['checkbox'])
            final_output.append(pair['option_label'])
            
    for i, chk in enumerate(checkboxes):
        if i not in used_checkbox_idx:
            final_output.append(chk)
            
    for det in detections:
        if det['class'] not in [CHECKBOX_ID, INPUT_LABEL_ID]:
            final_output.append(det)

    # Global sort: Top-to-bottom, then left-to-right
    return sorted(final_output, key=lambda d: (d.get('bbox', [0,0,0,0])[1] // 20, d.get('bbox', [0,0,0,0])[0]))