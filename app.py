from flask import Flask, request, jsonify, render_template
import os
from flask_socketio import SocketIO, emit
from model.detection import object_detection
from model.heatmap import heatmap
from ultralytics import solutions
import cv2
import base64
import numpy as np
import time
from model.param import *
from ultralytics import YOLO
from gevent import pywsgi

app = Flask(__name__, template_folder="templates")


app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)


def get_data_source():
    return data_source


app.add_template_global(get_data_source, "get_data_source")


@app.route("/")
def index():
    return render_template("main.html", data_source=data_source)


# @app.route('/upload_floder/<path:filename>')
# def upload_floder(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


# @app.route('/processed_floder/<path:filename>')
# def processed_floder(filename):
#     return send_from_directory(PROCESSED_FOLDER, filename)


@app.route("/set_data_source", methods=["POST"])
def set_data_source():
    global data_source
    data = request.get_json()
    data_source = data["source"]
    return jsonify(data)  # resp


@app.route("/set_param")
def set_param():
    global parma, heatmap_model, detcetion_model, mode
    device = request.args.get("device", default=None, type=str)
    model_size = request.args.get("model_size", default=None, type=str)
    mode = request.args.get("mode", default=None, type=str)
    parma = {"device": device, "model_size": model_size}
    print(parma)
    detcetion_model = YOLO(f"weight/yolo11{model_size}.pt").to(device)
    heatmap_model = solutions.Heatmap(
        model=f"weight/yolo11{model_size}.pt",  # Path to the YOLO11 model file
        colormap=cv2.COLORMAP_JET,  # Colormap of heatmap
        line_width=1,
        # show=True,  # Display the output
        device=device,
    )
    return jsonify(parma)  # resp


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"message": "No file part"})
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No selected file"})
    if file:
        filename = file.filename
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        return jsonify({"message": "File successfully uploaded"})


# ws route
@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("video_stream")
def handle_video_feed(message):
    frame_data = message["dataURL"].split(",")[1]
    if len(frame_data) == 0 or mode is None:
        pass
    # decode numpy
    nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
    # print(type(frame_data), type(nparr))
    # decode opencv
    if nparr.size == 0:
        pass
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if detcetion_model is not None and mode == "detection":
        processed_image, _, fps = object_detection(detcetion_model, frame, conf=0.5)
        # img to stream
        _, buffer = cv2.imencode(".jpg", processed_image)
        jpg_as_text = base64.b64encode(buffer).decode()

        emit(
            "img_resp",
            {"img_resp": jpg_as_text, "fps": fps, "second": int(time.time())},
        )
    if heatmap_model is not None and mode == "heatmap":
        t0 = time.time()
        processed_image = heatmap(heatmap_model, frame)
        t1 = time.time()
        fps = 1.0 / (t1 - t0)
        # img to stream
        cv2.putText(
            processed_image,
            f"FPS: {fps:.2f}",
            (50, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        _, buffer = cv2.imencode(".jpg", processed_image)
        jpg_as_text = base64.b64encode(buffer).decode()

        emit(
            "img_resp",
            {"img_resp": jpg_as_text, "fps": fps, "second": int(time.time())},
        )


if __name__ == "__main__":
    # socketio.run(app, debug=True)
    # app.run(debug=True)
    # using wsgi to solve cam stream slow

    # from geventwebsocket.handler import WebSocketHandler
    # socketio = SocketIO(app, async_mode='gevent_uwsgi')
    # server = pywsgi.WSGIServer(("127.0.0.1", 5000), app, handler_class=WebSocketHandler)
    server = pywsgi.WSGIServer(("127.0.0.1", 5000), app)
    server.serve_forever()
