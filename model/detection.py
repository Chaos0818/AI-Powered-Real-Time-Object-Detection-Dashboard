import os

os.environ["YOLO_VERBOSE"] = str(False)
import cv2
from ultralytics import YOLO
import numpy as np
from ultralytics.utils.plotting import Colors


color = Colors()


def object_detection(
    chosen_model, img, conf=0.5, rectangle_thickness=1, text_thickness=1
):
    results = chosen_model.predict(img, conf=conf)

    infer_time = 0
    for result in results:
        infer_time += (
            result.speed["preprocess"]
            + result.speed["inference"]
            + result.speed["postprocess"]
        )
        for box in result.boxes:
            cv2.rectangle(
                img,
                (int(box.xyxy[0][0]), int(box.xyxy[0][1])),
                (int(box.xyxy[0][2]), int(box.xyxy[0][3])),
                color(int(box.cls[0]), True),
                rectangle_thickness,
            )
            cv2.putText(
                img,
                f"{result.names[int(box.cls[0])]} {float(box.conf):.2f}",
                (int(box.xyxy[0][0]), int(box.xyxy[0][1]) - 10),
                cv2.FONT_HERSHEY_PLAIN,
                1,
                color(int(box.cls[0]), True),
                text_thickness,
            )
    # show FPS
    if len(results) == 0 or infer_time == 0:
        pass
    fps = 1000 / infer_time
    cv2.putText(
        img, f"FPS: {fps:.2f}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
    )
    return img, results, fps


def main():
    # load model
    model = YOLO("weight/yolo11n.pt").to("cpu")
    # model = YOLO("weight/yolo11n.pt").to("cuda")

    # open camera
    cap = cv2.VideoCapture(0)

    while True:
        success, img = cap.read()
        if not success:
            break
        # inferance
        result_img, _, _ = object_detection(model, img, conf=0.5)
        cv2.imshow("YOLOv11 Video Detection", result_img)
        cv2.waitKey(1)

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
