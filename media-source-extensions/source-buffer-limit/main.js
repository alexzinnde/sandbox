import "./style.css";


// const videoElement = document.querySelector<HTMLVideoElement>('#video-1')
const video = document.createElement('video');

console.log('video [%o]', video)
if (!video) throw new Error('No Video Element Found')

const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);

video.addEventListener("error", function () {
  time.textContent += "\nvideo.error.message = " + video.error.message;
});

var size = 0;
var s;

mediaSource.addEventListener(
  "sourceopen",
  function () {
    //mediaSource.duration = +Infinity;
    URL.revokeObjectURL(video.src);

    const sourceBuffer = mediaSource.addSourceBuffer(
      'video/mp4; codecs="avc1.4d401f"'
    );
    sourceBuffer.mode = "sequence";
    s = sourceBuffer;

    sourceBuffer.addEventListener("abort", function () {
      console.count("abort");
    });
    sourceBuffer.addEventListener("error", function () {
      console.count("error");
    });
    sourceBuffer.addEventListener("updatestart", function () {
      console.count("updatestart");
    });
    sourceBuffer.addEventListener("update", function () {
      console.count("update");
    });
    sourceBuffer.addEventListener("updateend", function () {
      console.count("updateend");
      log();
    });

    Promise.resolve()
      .then((_) =>
        fetch(
          "https://storage.googleapis.com/fbeaufort-test/sample-video.mp4",
          { headers: { range: "bytes=0-2343" } }
        )
      )
      .then((response) => response.arrayBuffer())
      .then((data) => {
        return new Promise((resolve, reject) => {
          sourceBuffer.appendBuffer(data);
          sourceBuffer.addEventListener(
            "updateend",
            function () {
              size += data.byteLength;
              resolve();
            },
            { once: true }
          );
        });
      })
      .then((_) =>
        fetch(
          "https://storage.googleapis.com/fbeaufort-test/sample-video.mp4",
          { headers: { range: "bytes=2344-939299" } }
        )
      )
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const url = new URL(location);
        if (url.searchParams.has("currentTime")) {
          video.currentTime = Number(url.searchParams.get("currentTime"));
        }

        (function appendSomeData(percent) {
          try {
            var byteLength =
              percent === 100
                ? data.byteLength
                : Math.round((data.byteLength * percent) / 100);
            sourceBuffer.appendBuffer(data.slice(0, byteLength));
            sourceBuffer.addEventListener(
              "updateend",
              function () {
                size += byteLength;
                appendSomeData(percent);
              },
              { once: true }
            );
          } catch (error) {
            console.debug(percent, byteLength, error.name);
            if (error.name !== "QuotaExceededError") {
              log(error);
              return;
            }
            if (percent <= 5) {
              log(error);
              return;
            }
            if (percent < 100 && url.searchParams.has("abort")) {
              sourceBuffer.abort();
            }
            appendSomeData(percent - 5);
          }
        })(100);
      });
  },
  { once: true }
);

function log(text) {
  time.textContent =
    "Buffer size:    " + (size / 1024 / 1024).toFixed(2) + " MB\n";
  if (video.buffered.length) {
    time.textContent += `Buffered range: [${video.buffered.start(
      0
    )} - ${video.buffered.end(0)}) | Length: ${video.buffered.length}\n`;
  }
  if (video.seekable.length) {
    time.textContent += `Seekable range: [${video.seekable.start(
      0
    )} - ${video.seekable.end(0)}) | Length: ${video.seekable.length}\n`;
  }
  if (text) {
    time.textContent += "\n" + text;
  }
}
