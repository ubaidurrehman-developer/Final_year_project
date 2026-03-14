"""
SIMPLE CONVERSION TESTER
-------------------------
Tests if your PDF or image file is converting correctly to PNG.

HOW TO USE:
1. Install requirements:
      pip install pdf2image pillow
      (also install poppler):
      - Windows: https://github.com/oschwartz10612/poppler-windows/releases
      - Mac:     brew install poppler
      - Linux:   sudo apt install poppler-utils

2. Put your test file (PDF or image) in the same folder as this script

3. Change FILE_TO_TEST below to your file name

4. Run: python test_conversion.py
"""

import os
from PIL import Image

# -----------------------------------------------
# CHANGE THIS TO YOUR FILE NAME
FILE_TO_TEST = "git_or_github__commands.pdf"   # e.g. "form.pdf" or "form.png" or "form.jpg"
OUTPUT_FOLDER = "converted_output"
# -----------------------------------------------


def convert_file(file_path):
    extension = file_path.split('.')[-1].lower()

    print(f"\n--- Starting Conversion ---")
    print(f"File     : {file_path}")
    print(f"Type     : {extension.upper()}")

    # Create output folder if it doesn't exist
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    if extension in ['png', 'jpg', 'jpeg']:
        # Already an image — just copy and confirm it opens correctly
        img = Image.open(file_path)
        output_path = os.path.join(OUTPUT_FOLDER, "converted_output.png")
        img.save(output_path, "PNG")
        return [output_path]

    elif extension == 'pdf':
        from pdf2image import convert_from_path

        print("Converting PDF pages to PNG...")
        pages = convert_from_path(file_path, dpi=300)

        saved_files = []
        for i, page in enumerate(pages):
            output_path = os.path.join(OUTPUT_FOLDER, f"page_{i+1}.png")
            page.save(output_path, "PNG")
            saved_files.append(output_path)
            print(f"  ✔ Page {i+1} saved → {output_path}")

        return saved_files

    else:
        print(f" Unsupported file type: {extension}")
        print("   Supported types: PDF, PNG, JPG, JPEG")
        return []


def verify_output(file_paths):
    """
    Opens each converted PNG and prints basic info
    so you can confirm it converted correctly
    """
    print(f"\n--- Verifying Output ---")

    if not file_paths:
        print("No files to verify.")
        return

    for path in file_paths:
        img = Image.open(path)
        width, height = img.size
        mode = img.mode  # RGB, RGBA, etc.
        file_size_kb = os.path.getsize(path) // 1024

        print(f"\n  File      : {path}")
        print(f"  Size      : {width} x {height} pixels")
        print(f"  Mode      : {mode}")
        print(f"  File size : {file_size_kb} KB")

        # Basic quality check
        if width < 500 or height < 500:
            print("   WARNING: Image resolution seems low — may affect YOLO accuracy")
        else:
            print("   Resolution looks good for YOLO")


def main():
    # Check if file exists
    if not os.path.exists(FILE_TO_TEST):
        print(f"\n File not found: '{FILE_TO_TEST}'")
        print(f"   Make sure the file is in the same folder as this script.")
        print(f"   Current folder: {os.getcwd()}")
        return

    # Run conversion
    output_files = convert_file(FILE_TO_TEST)

    # Verify results
    verify_output(output_files)

    if output_files:
        print(f"\n CONVERSION SUCCESSFUL!")
        print(f"   Check the '{OUTPUT_FOLDER}' folder to visually inspect your PNG files.")
    else:
        print(f"\n CONVERSION FAILED. Check the errors above.")


if __name__ == "__main__":
    main()