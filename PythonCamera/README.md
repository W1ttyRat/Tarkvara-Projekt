# PythonCamera — ALPR tools

This folder contains Python utilities used for Automatic License Plate Recognition (ALPR) and simple camera-based experiments referenced by the project. The scripts are intended as a companion toolset for detecting license plates from images and video.

## Contents

- `detFromImage.py` — Detect plates from a single image (file input).
- `detFromVideo.py` — Process video stream or file and detect plates frame-by-frame.

## Prerequisites

- Python 3.9+
- A working virtual environment (recommended)
- System dependencies for OpenCV (on Windows, the `opencv-python` wheel is usually sufficient)

## Installation

From the `PythonCamera` directory:

```bash
python -m venv .venv
# Activate on Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# or on cmd.exe:
.\.venv\Scripts\activate.bat
# or on macOS / Linux:
source .venv/bin/activate

pip install --upgrade pip
pip install opencv-python numpy mss
# If the project used a specific ALPR lib (fast_alpr) install it if available:
# pip install fast-alpr
```

Note: If additional packages are required by the scripts, they will be listed at the top of each script file.

## Usage

Detect from an image:

```bash
python detFromImage.py --image path/to/image.jpg
```

Process a video file or camera stream:

```bash
python detFromVideo.py --source path/to/video.mp4
# or to use the default webcam device
python detFromVideo.py --source 0
```

Check the top of each script for available command-line options and flags.

## Output

Scripts typically print detected plate text and bounding boxes to stdout and/or overlay detections on a displayed window. Modify the scripts to save results to disk if persistent logs are required.

## Troubleshooting

- If OpenCV fails to open the camera, ensure no other process is using it and try different device indices (0,1,...).
- On Windows, ensure `opencv-python` wheel matches your Python version and architecture.
- For low detection rates, adjust image pre-processing (grayscale, histogram equalization) and detection model thresholds.

## License & Safety

Be mindful of local laws and privacy concerns when using ALPR technology. Use for authorized, ethical, and lawful purposes only.


