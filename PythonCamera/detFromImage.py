from pathlib import Path

import cv2

from fast_alpr import ALPR

BASE_DIR = Path(__file__).resolve().parent

# Initialize the ALPR system with the specified models
MODEL = ALPR(
    detector_model="yolo-v9-t-384-license-plate-end2end",
    ocr_model="cct-xs-v1-global-model",
)

# load the image
def load_image(image_path):
    frame = cv2.imread(str(image_path))
    return frame

def draw_predictions(frame):
    annotated_frame = MODEL.draw_predictions(frame)
    return annotated_frame.image

def get_predictions(frame):
    predictions = MODEL.predict(frame)
    return predictions

# save the annotated image
def save_annotated_image(annotated_frame):
    output_path = BASE_DIR / "AnnotatedImages" / "annotated_image.jpg"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), annotated_frame)




if __name__ == "__main__":
    image_path = BASE_DIR / "TestImages" / "image6.jpg"
    frame = load_image(image_path)
    if frame is None:
        raise FileNotFoundError(f"Could not read image at {image_path}")

    annotated_frame = draw_predictions(frame)
    save_annotated_image(annotated_frame)

    results = get_predictions(frame)
    for r in results:
        plate_text = r.ocr.text
        ocr_confidence = r.ocr.confidence
        det_confidence = r.detection.confidence
        box = r.detection.bounding_box

        print(ocr_confidence)
        print(det_confidence)


#        if ocr_confidence > 0.6 and det_confidence > 0.6:
#            print(f"High confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")
#        else:
#            print(f"Low confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")
