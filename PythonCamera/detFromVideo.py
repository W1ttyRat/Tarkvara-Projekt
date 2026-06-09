from pathlib import Path

import cv2, mss, time, json
from fast_alpr import ALPR
import numpy as np

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

# draw the predictions on the image
def draw_predictions(frame):
    annotated_frame = MODEL.draw_predictions(frame)
    return annotated_frame

# get the predictions for the image
def get_predictions(frame):
    predictions = MODEL.predict(frame)
    return predictions

# save the annotated image
def save_annotated_image(annotated_frame):
    output_path = BASE_DIR / "AnnotatedImages" / "annotated_image.jpg"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), annotated_frame)

# process video frames from a video file or webcam
def process_video(source):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        results = get_predictions(frame)
        for r in results:
            plate_text = r.ocr.text
            ocr_confidence = r.ocr.confidence
            det_confidence = r.detection.confidence
            box = r.detection.bounding_box

            if ocr_confidence > 0.6 and det_confidence > 0.6:
                print(f"High confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")
            else:
                print(f"Low confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")

        

    cap.release()

# process video frames from a specific monitor for a certain duration
def process_monitor(monitor_index=2, duration_seconds=30):

    with mss.mss() as sct:

        start_time = time.time()
        monitor = sct.monitors[monitor_index]

        while True:

            if time.time() - start_time >= duration_seconds:
                break

            img = np.array(sct.grab(monitor))
            frame = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

            results = get_predictions(frame)

            for r in results:
                plate_text = r.ocr.text
                ocr_confidence = r.ocr.confidence
                det_confidence = r.detection.confidence
                box = r.detection.bounding_box

                if ocr_confidence > 0.98 and det_confidence > 0.82 and plate_text not in CarSet:
                    CarSet.add(plate_text)
                    CarList.append((plate_text, round(ocr_confidence, 2), round(det_confidence, 2)))


                if ocr_confidence > 0.6 and det_confidence > 0.6:
                    print(f"High confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")
                else:
                    print(f"Low confidence for plate: {plate_text}, OCR Confidence: {ocr_confidence:.2f}, Detection Confidence: {det_confidence:.2f}, Box: {box}")


def save_carlist_json(car_list, output_path="carlist.json"):
    output_path = BASE_DIR / output_path
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump([{"plate": p, "ocr_confidence": o, "det_confidence": d} for p, o, d in car_list], f, indent=2)


if __name__ == "__main__":
    print("Starting ALPR system in 2 seconds...")
    CarSet = set()
    CarList = []
    time.sleep(2)
    

    # For webcam, use 0
    #process_video(0)

    # For video file, provide the path
    process_video(BASE_DIR / "carVideo2.mp4")

    # For 2nd monitor screen capture
    #process_monitor(2, duration_seconds=25)

    for plate_info in CarList:
        print(f"Detected Plate: {plate_info[0]}, OCR Confidence: {plate_info[1]}, Detection Confidence: {plate_info[2]}")
    
    save_carlist_json(CarList, "carlist.json")


