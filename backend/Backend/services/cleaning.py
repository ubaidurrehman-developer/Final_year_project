# cleaning.py — OCR text cleaning and class-name constants
import re

# -----------------------
# YOLO class definitions
# -----------------------
CLASS_NAMES = ["input_label", "checkboxes", "table", "text", "image", "bbox"]


INPUT_LABEL_ID = 3
CHECKBOX_ID    = 1
TABLE_ID       = 2
IMAGE_ID       = 4
BBOX_ID        = 5


# -------------------
# OCR text cleaning
# -------------------

_WORD_FIXES = {
    r"\bAdyvisor\b":   "Advisor",
    r"\bRo11\b":       "Roll",
    r"\bDlscipline\b": "Discipline",
    r"\bSernester\b":  "Semester",
    r"\bSlgnature\b":  "Signature",
    r"\bApprovéd\b":   "Approved",
    r"\bN0\b":         "No",
}


def clean_ocr_text(raw_text_list: list) -> list:
    """
    Clean a list of raw OCR text lines.

    Steps:
        1. Strip brackets, pipes, colons, dashes, etc.
        2. Normalize whitespace.
        3. Remove isolated single characters (except 's)').
        4. Remove stray punctuation.
        5. Apply known word-fix corrections.
    """
    if not raw_text_list:
        return []

    cleaned = []
    for item in raw_text_list:
        if not item:
            continue

        text = re.sub(r'[[\]|{}:;\u2012-\u2015-]', '', item)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\b(?!s\))([a-zA-Z0-9])\b', '', text)
        text = re.sub(r'[.\'\"]+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        for pattern, correct in _WORD_FIXES.items():
            text = re.sub(pattern, correct, text, flags=re.IGNORECASE)

        if text:
            cleaned.append(text)

    return cleaned
