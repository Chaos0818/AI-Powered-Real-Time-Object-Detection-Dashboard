import cv2
from ultralytics import solutions
from ultralytics import YOLO
import numpy as np
from ultralytics.utils.plotting import Colors

color = Colors()


def heatmap(model, img):
    result_img = model.generate_heatmap(img)
    return result_img


def main():
    cap = cv2.VideoCapture(0)
    # Init heatmap
    heatmap = solutions.Heatmap(
        model="weight/yolo11n.pt",  # Path to the YOLO11 model file
        colormap=cv2.COLORMAP_JET,  # Colormap of heatmap
        line_width=1,
    )

    while True:
        success, img = cap.read()
        if not success:
            break
        #
        result_img = heatmap.generate_heatmap(img)
        cv2.imshow("YOLOv11 Video Detection", result_img)
        cv2.waitKey(1)

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
