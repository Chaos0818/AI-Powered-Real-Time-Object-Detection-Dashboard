# AI-Powered Real-Time Object Detection Dashboard

WKU 2024 Fall Zhang Dinggen CPS5745 project

This repository contains a set of Python scripts for object detection and heatmap generation using the YOLO (You Only Look Once) model. The application is built with Flask for web interaction and SocketIO for real-time video streaming.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Usage](#usage)
- [Dependencies](#dependencies)

## Overview

This application allows users to perform object detection and heatmap generation on images and video streams using the YOLO model. It includes the following features:

- Real-time object detection in video streams.
- Heatmap generation for object detection.
- Web interface for easy interaction.

## Setup

To set up the application, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yolo-app.git
   cd yolo-app
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

## Usage

- Open your web browser and navigate to `http://127.0.0.1:5000/` to access the web interface.
- Use the provided interface to upload images or set the data source for video streams.
- Select the desired model and parameters for object detection or heatmap generation.
- View the results in real-time or download processed images.

## Dependencies

The application relies on the following Python libraries:

- `Flask`: Web framework for creating the web application.
- `Flask-SocketIO`: Extension for WebSocket communication.
- `ultralytics`: Library for YOLO model inference.
- `opencv-python`: Library for image processing and computer vision.
- `numpy`: Library for numerical calculations.
- `gevent`: Library for asynchronous networking.

These dependencies are listed in the `requirements.txt` file.
