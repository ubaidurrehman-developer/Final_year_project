# clustering.py — Checkbox-label pairing and form-element grouping
import logging
from .cleaning import CHECKBOX_ID, INPUT_LABEL_ID

logger = logging.getLogger(__name__)


def get_center(bbox):
    """Return (cx, cy) of a bounding box [x1, y1, x2, y2]."""
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def clusters_formation(detections: list) -> list:
    """
    Group detected form elements into logical clusters.

    Logic:
        1. Separate detections into checkboxes and input_labels.
        2. Pair each checkbox with the label immediately to its right → OPTION.
        3. Unpaired labels → GROUP LABELS (parent).
        4. Assign options to the nearest parent label (same line or above).
        5. Collect orphaned elements.
    """
    checkboxes = [d for d in detections if d["class"] == CHECKBOX_ID]
    input_labels = [d for d in detections if d["class"] == INPUT_LABEL_ID]

    # -- Step 1: Pair each checkbox with its nearest right-side label ----------
    options_pairs = []
    used_checkbox_idx = set()
    used_label_idx = set()

    for i, chk in enumerate(checkboxes):
        chk_x1 = chk["bbox"][0]
        chk_y1 = chk["bbox"][1]
        chk_x2 = chk["bbox"][2]

        best_label_idx = None
        min_y_diff = float("inf")

        for j, label in enumerate(input_labels):
            if j in used_label_idx:
                continue

            label_x1 = label["bbox"][0]
            label_y1 = label["bbox"][1]
            y_diff = abs(chk_y1 - label_y1)

            # Label must be to the right and very close vertically
            if y_diff <= 10 and chk_x1 < label_x1 and (label_x1 - chk_x2) < 50:
                if y_diff < min_y_diff:
                    min_y_diff = y_diff
                    best_label_idx = j

        if best_label_idx is not None:
            options_pairs.append(
                {
                    "checkbox": chk,
                    "option_label": input_labels[best_label_idx],
                    "combined_bbox": [
                        chk["bbox"][0],
                        min(chk["bbox"][1], input_labels[best_label_idx]["bbox"][1]),
                        input_labels[best_label_idx]["bbox"][2],
                        max(chk["bbox"][3], input_labels[best_label_idx]["bbox"][3]),
                    ],
                }
            )
            used_checkbox_idx.add(i)
            used_label_idx.add(best_label_idx)

    # -- Step 2: Identify parent labels (not used as checkbox options) ----------
    remaining_labels = [
        lbl for i, lbl in enumerate(input_labels) if i not in used_label_idx
    ]

    # -- Step 3: Assign options to nearest parent --------------------------------
    parent_to_options = {i: [] for i in range(len(remaining_labels))}
    used_option_pair_idx = set()

    for j, pair in enumerate(options_pairs):
        opt_bbox = pair["combined_bbox"]
        opt_y1, opt_x1 = opt_bbox[1], opt_bbox[0]

        best_parent_idx = None
        min_distance = float("inf")

        for i, parent in enumerate(remaining_labels):
            p_bbox = parent["bbox"]
            p_y1, p_x1, p_y2, p_x2 = p_bbox[1], p_bbox[0], p_bbox[3], p_bbox[2]

            # Logic A: Parent is on the same line to the left
            is_same_line = abs(p_y1 - opt_y1) <= 15 and p_x2 < opt_x1

            # Logic B: Parent is directly above (vertical list)
            is_above = 0 < (opt_y1 - p_y2) < 200 and abs(p_x1 - opt_x1) < 500

            if is_same_line or is_above:
                dist = opt_y1 - p_y2 if is_above else abs(p_y1 - opt_y1)
                if dist < min_distance:
                    min_distance = dist
                    best_parent_idx = i

        if best_parent_idx is not None:
            parent_to_options[best_parent_idx].append(
                pair["option_label"].get("text", "")
            )
            used_option_pair_idx.add(j)

    # -- Step 4: Build final output -----------------------------------------------
    final_output = []
    used_parent_indices = set()

    for i, options in parent_to_options.items():
        if options:
            final_output.append(
                {
                    "bbox": remaining_labels[i]["bbox"],
                    "options": options,
                    "label": remaining_labels[i].get("text", "").strip(),
                }
            )
            used_parent_indices.add(i)

    # Orphaned labels (like "Signature Date", "Name")
    for i, parent in enumerate(remaining_labels):
        if i not in used_parent_indices:
            final_output.append(parent)

    # Orphaned option pairs (checkboxes that found no parent)
    for j, pair in enumerate(options_pairs):
        if j not in used_option_pair_idx:
            final_output.append(pair["checkbox"])
            final_output.append(pair["option_label"])

    # Standalone checkboxes
    for i, chk in enumerate(checkboxes):
        if i not in used_checkbox_idx:
            final_output.append(chk)

    # Everything else (tables, images, etc.)
    for det in detections:
        if det["class"] not in [CHECKBOX_ID, INPUT_LABEL_ID]:
            final_output.append(det)

    final_output = sorted(
        final_output,
        key=lambda d: (
            d.get("bbox", [0, 0, 0, 0])[1] // 20,
            d.get("bbox", [0, 0, 0, 0])[0],
        ),
    )

    logger.info("Clustering: %d elements → %d clusters", len(detections), len(final_output))
    return final_output
