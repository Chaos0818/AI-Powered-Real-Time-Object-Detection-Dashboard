class FixedSizeQueue {
  constructor(size) {
    this.queue = new Array(size);
    this.head = 0;
    this.tail = 0;
    this.maxSize = size;
    this.count = 0;
  }

  enqueue(item) {
    if (this.count === this.maxSize) {
      this.dequeue();
    }
    this.queue[this.tail] = item;
    this.tail = (this.tail + 1) % this.maxSize;
    this.count++;
  }

  dequeue() {
    if (this.count === 0) {
      return undefined;
    }
    const item = this.queue[this.head];
    this.queue[this.head] = null;
    this.head = (this.head + 1) % this.maxSize;
    this.count--;
    return item;
  }

  size() {
    return this.count;
  }

  peek() {
    if (this.size() === 0) {
      return undefined;
    }
    return this.queue[this.head];
  }

  toList() {
    const list = [];
    for (let i = this.head; i < this.head + this.count; i++) {
      list.push(this.queue[i % this.maxSize]);
    }
    return list;
  }
}

const fps_queue = new FixedSizeQueue(20);
const time_queue = new FixedSizeQueue(20);

function formatTimestamp(ts) {
  var date = new Date(ts);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  const second = date.getSeconds().toString().padStart(2, "0");
  const millisecond = date.getMilliseconds().toString().padStart(3, "0");
  return `${year}-${month}-${day}\n${hour}:${minute}:${second}.${millisecond}`;
}

var trace1 = {
  x: [],
  y: [],
  type: "scatter",
  mode: "lines+markers",
};
var chart_start = new Date().getTime();
var layout = {
  title: "Real-time FPS Chart",
  xaxis: {
    title: "Time",
    range: [chart_start, chart_start + 1000],
    tickmode: "array",
    tickvals: [chart_start + 100, chart_start + 900],
    ticktext: [
      formatTimestamp(chart_start),
      formatTimestamp(chart_start + 1000),
    ],
  },
  yaxis: {
    title: "Frames Per Second (FPS)",
    range: [0, 200],
  },
};
Plotly.newPlot("fps-chart", [trace1], layout);

// function updateChart() {
//   var now = new Date().getTime();
//   var newxLayout = {
//     xaxis: {
//       range: [now, now + 1000],
//     },
//   };
//   Plotly.relayout("fps-chart", newxLayout);
// }
// var initChart= setInterval(updateChart, 100);

function clear_res() {
  Plotly.newPlot("fps-chart", [trace1], layout);
  videoElement_result.src = "";
  // socket.onC
}

//
function set_source(s) {
  $.ajax({
    url: "/set_data_source",
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify({ source: s }),
    success: function (response) {
      console.log("OK updating variable");
      document.getElementById("now_source").innerText = response.source;
      if (s == "image") {
        document.getElementById(
          "origin-media"
        ).innerHTML = `<img src="{{ url_for('static', filename='images/{s["file"].filename}') }}" alt="Image">`;
      } else {
        document.getElementById(
          "origin-media"
        ).innerHTML = `<video id="videoElement_origin" autoplay ></video> `;
      }
    },
    error: function () {
      console.log("Error updating variable");
    },
  });
}

const startCameraButton = document.getElementById("openCameraStream");
const videoElement_origin = document.getElementById("videoElement_origin");
const videoElement_result = document.getElementById("videoElement_result");

var socket = io.connect("http://" + document.domain + ":" + location.port);

socket.on("connect", function () {
  socket.send("User has connected!");
});

socket.on("img_resp", function (data) {
  // console.log("Received from server: ");
  var imageSrc = "data:image/jpeg;base64," + data.img_resp;
  document.getElementById("fps-value").innerText = data.fps.toFixed(2);
  videoElement_result.src = imageSrc;
  fps_queue.enqueue(data.fps.toFixed(2));
  time_queue.enqueue(new Date().getTime());
  // clearInterval(initChart);

  // fps chart update label
  var now = new Date().getTime();
  var newLayout = {
    xaxis: {
      title: { text: "Time" },
      range: [now - 1000, now],
      tickmode: "array",
      tickvals: [now - 900, now - 100],
      ticktext: [formatTimestamp(now - 1000), formatTimestamp(now)],
    },
    yaxis: {
      range: [-10, 200],
      title: { text: "Frames Per Second (FPS)" },
      tickmode: "array",
      tickvals: [-10, 0, 50, 100, 150, 200],
      ticktext: ["", "0", "50", "100", "150", "200"],
    },
  };
  Plotly.relayout("fps-chart", newLayout);
  // fps chart update lane
  var newLane = {
    x: [[time_queue.dequeue()]],
    y: [[parseFloat(fps_queue.dequeue())]],
  };
  Plotly.extendTraces("fps-chart", newLane, [0]);
});

function checkRadio() {
  var inferenceRadios = document.querySelectorAll('input[name="inference"]');
  var modelRadios = document.querySelectorAll('input[name="model"]');
  var source = document.getElementById("now_source").innerText;

  var inferenceChecked = false;
  var modelChecked = false;

  inferenceRadios.forEach(function (radio) {
    if (radio.checked) {
      inferenceChecked = true;
    }
  });

  modelRadios.forEach(function (radio) {
    if (radio.checked) {
      modelChecked = true;
    }
  });

  if (inferenceChecked && modelChecked && source != "None") {
    var result = {
      inference: Array.from(inferenceRadios).find((radio) => radio.checked)
        .value,
      model: Array.from(modelRadios).find((radio) => radio.checked).value,
    };
    console.log(result);
    return result;
  } else {
    // console.log(false);
    return false;
  }
}

function setParam(device, model, mode) {
  var url = `/set_param?device=${device}&model_size=${model}&mode=${mode}`;

  fetch(url)
    .then((response) => response.text())
    .then((data) => {
      console.log("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function startProcess(mode) {
  socket.disconnect();
  socket.connect();
  var radio_info = checkRadio();
  if (!radio_info) {
    alert("Please selsct device and model size!!!");
    return;
  } else {
    setParam(radio_info["inference"], radio_info["model"], mode);
  }
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        var videoElement_origin = document.getElementById(
          "videoElement_origin"
        );
        // videoElement_origin.srcObject = stream;
        var lastFrameTime = Date.now();
        var frameRate = 20;
        function captureFrame() {
          if (Date.now() - lastFrameTime > 1000 / frameRate) {
            lastFrameTime = Date.now();
            var canvas = document.createElement("canvas");
            canvas.width = videoElement_origin.videoWidth;
            canvas.height = videoElement_origin.videoHeight;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(
              videoElement_origin,
              0,
              0,
              canvas.width,
              canvas.height
            );
            var dataURL = canvas.toDataURL("image/jpeg");
            socket.emit("video_stream", { dataURL: dataURL, mode: mode });
          }
          requestAnimationFrame(captureFrame);
        }
        captureFrame();
      })
      .catch(function (error) {
        console.error("Error accessing the device camera:", error);
      });
  }
}

// js get cam stream
startCameraButton.addEventListener("click", function () {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      // display cam
      var videoElement_origin = document.getElementById("videoElement_origin");
      videoElement_origin.srcObject = stream;
    })
    .catch(function (error) {
      console.error("Error accessing camera: ", error);
    });
});

$(document).ready(function () {
  $(".uploadButton").click(function () {
    $("#fileInput").click();
  });

  $("#fileInput").on("change", function () {
    var file = this.files[0];
    if (file) {
      var formData = new FormData();
      formData.append("file", file);

      $.ajax({
        url: "/upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
          alert("File uploaded successfully");
          // // window.location.reload();
          // $('#origin-media').html(response);
        },
        error: function (error) {
          alert("Error uploading file");
        },
      });
    }
  });
});
