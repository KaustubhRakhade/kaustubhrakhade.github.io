/**

TODO

* zoom slider on wider screen

 */

const gallery = document.querySelector("#gallery");
const imgSlider = document.querySelector("#imgSlider");
const imgViewer = document.querySelector("#imgViewer");
const imgViewBox = document.querySelector("#imgViewBox");
const lazyloader = document.querySelector("#lazyloader");

var images = [];
var i = 0;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    images = JSON.parse(xhttp.responseText);
    images = images.slice(0, 60);
    console.log(images);
    // openViewer(0)
    populate();
  }
};
xhttp.open("GET", "imagedata.json", true);
xhttp.send();

counter = 0;
function incrementCounter() {
  counter++;
  console.log(counter);
  if (counter == document.querySelectorAll("#gallery img").length) {
    console.log("all images loaded");
    for (i = 0; i < images.length; i++) {
      lazyloader.innerHTML += `<img src="${images[i].download_url}">`;
    }
  }
}

function populate() {
  for (i = 0; i < images.length; i++) {
    gallery.innerHTML += `
            <div class="imgBox" title="${(
              (images[i].height * images[i].width) /
              1000000
            ).toFixed(1)} MP &#x2022; ${(images[i].size / 1024).toFixed()} KB">
                <img alt="Failed to load" onclick="openViewer(${i})" src="${images[i].thumbnail_url}">
                <!-- <input class="material-symbols-outlined infoBTN" type="button" value="info" title="More info"> -->
                <input onclick="downloadImg(${i}, this)" class="material-symbols-outlined downloadBTN" type="button" value="download" title="Download &#x2022; ${(images[i].size / 1024).toFixed()} KB">
            </div>
        `;
    imgSlider.innerHTML += `<img onclick="showImage(${i})" src="${images[i].thumbnail_url}">`;
  }

  imgs = document.querySelectorAll("#gallery img");
  imgs.forEach((img) =>
    img.complete
      ? incrementCounter()
      : img.addEventListener("load", incrementCounter, false)
  );
}

var pushed = false;
function openViewer(index) {
  if (!pushed) {
    history.pushState(null, null, window.location.pathname);
    pushed = true;
  }

  i = (images.length + index) % images.length;
  document.querySelector("#imgViewer").style.display = "flex";
  document.querySelector("#navBTNs").style.width = "10.5rem";
  showImage(i);
}

function closeViewer() {
  stopSlideshow();
  document.querySelector("#imgViewer").style.display = "none";
  document.querySelector("#navBTNs").style.width = "3.5rem";
}

var slideShow;
function startSlideshow() {
  document.querySelector("#stop_btn").style.display = "flex";
  document.querySelector("#play_btn").style.display = "none";
  if (document.querySelector("#imgViewer").style.display != "flex") {
    openViewer(0);
  }
  clearInterval(slideShow);
  slideShow = setInterval(() => {
    // showImage(++i);
    simulateClick(document.querySelector("#next_img"));
  }, 2500);
}

function stopSlideshow() {
  document.querySelector("#stop_btn").style.display = "none";
  document.querySelector("#play_btn").style.display = "flex";
  clearInterval(slideShow);
}

function showImage(index) {
  i = (images.length + index) % images.length;
  document.querySelectorAll("#imgSlider img").forEach((element) => {
    element.classList.remove("active");
  });
  document.querySelector("#dl_btn").title = `Download • ${(
    images[i].size / 1024
  ).toFixed()} KB`;
  document.querySelectorAll("#imgSlider img")[i].classList.add("active");
  sliderWidth =
    imgSlider.getBoundingClientRect().right -
    imgSlider.getBoundingClientRect().left;

  imgSlider.scrollLeft =
    -24 +
    document.querySelectorAll("#imgSlider img")[i].offsetLeft -
    sliderWidth / 2;

  imgViewBox.style.background = `center / contain no-repeat url(${images[i].download_url})`;
  delX = 0;
  delY = 0;
  zoomScale = 1;
  doTransform(delX, delY, zoomScale);
}

function doTransform(x, y, scale) {
  height = imgViewer.getBoundingClientRect().bottom;
  width = imgViewer.getBoundingClientRect().right;
  delX = Math.min(Math.max(delX, -width / 2), width / 2);
  delY = Math.min(Math.max(delY, -height / 2), height / 2);
  imgViewBox.style.transform = `translate(${delX}px, ${delY}px) scale(${scale})`;
}

delX = 0;
delY = 0;
zoomScale = 1;

prevTimeStamp = 0;

imgViewer.addEventListener(
  "wheel",
  (e) => {
    if (e.deltaY != 0) {
      e.preventDefault();
    }
  },
  { passive: false }
);

imgViewBox.addEventListener("wheel", function (e) {
  e.preventDefault();
  var rect = imgViewBox.getBoundingClientRect();

  if (e.ctrlKey && e.timeStamp - prevTimeStamp > 50) {
    if (
      !(zoomScale == 4 && e.wheelDeltaY / 1250 > 0) &&
      !(zoomScale == 0.25 && e.wheelDeltaY / 1250 < 0)
    ) {
      zoomScale = zoomScale * (1 + e.wheelDeltaY / 1250);
      zoomScale = Math.max(0.25, Math.min(zoomScale, 4));

      var midpoint = [
        (rect.left + rect.right) / 2,
        (rect.top + rect.bottom) / 2,
      ];
      delX += (midpoint[0] - e.x) * (e.wheelDeltaY / 1250);
      delY += (midpoint[1] - e.y) * (e.wheelDeltaY / 1250);
      doTransform(delX, delY, zoomScale);
    }
    prevTimeStamp = e.timeStamp;
  } else if (!e.ctrlKey) {
    console.log(e);
    delX += e.wheelDeltaX / 2;
    delY += e.wheelDeltaY / 2;
    doTransform(delX, delY, zoomScale);
  }
});

imgViewBox.addEventListener("dblclick", function (e) {
  e.preventDefault();
  var rect = imgViewBox.getBoundingClientRect();

  if (zoomScale >= 4 / 3 || zoomScale <= 0.75) {
    delX = 0;
    delY = 0;
    zoomScale = 1;
    doTransform(delX, delY, zoomScale);
  } else {
    wheelDeltaY = 2;
    zoomScale *= 3;
    var midpoint = [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2];
    delX += (midpoint[0] - e.x) * wheelDeltaY;
    delY += (midpoint[1] - e.y) * wheelDeltaY;
    doTransform(delX, delY, zoomScale);
  }
});

window.addEventListener(
  "popstate",
  function (event) {
    // The popstate event is fired each time when the current history entry changes.
    if (document.querySelector("#imgViewer").style.display == "flex") {
      closeViewer();
      history.pushState(null, null, window.location.pathname);
    }
  },
  false
);

function downloadImg(index, elem) {
  elem.value = "downloading";
  stopSlideshow();

  const url = images[index].download_url;
  const options = {
    Accept: "application/json",
    "Content-Type": "application/json",
    cache: "force-cache",
  };

  fetch(url, options)
    .then((response) => {
      response.blob().then((blob) => {
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "CGS_gallery_" + index + ".jpg";
        a.click();

        elem.value = "download_done";
        setTimeout(() => {
          elem.value = "download";
        }, 2000);
      });
    })
    .catch((rejected) => {
      elem.value = "wifi_off";
      setTimeout(() => {
        elem.value = "download";
      }, 5000);
    });
}

function simulateClick(elem) {
  elem.click();
  elem.classList.add("active");
  elem.blur();
  setTimeout(() => {
    elem.classList.remove("active");
  }, 100);
}

document.addEventListener("keydown", function (e) {
  console.log(e);

  if (document.querySelector("#imgViewer").style.display == "flex") {
    if (e.code == "ArrowRight") {
      // showImage(i+1)
      simulateClick(document.querySelector("#next_img"));
    }
    if (e.code == "ArrowLeft") {
      // showImage(i-1)
      simulateClick(document.querySelector("#prev_img"));
    }
    if (e.code == "Escape") {
      closeViewer();
    }
  }
});

imgViewBox.addEventListener("mousemove", function (e) {
  if (e.buttons == 1) {
    console.log("drag");
    delX += e.movementX;
    delY += e.movementY;
    imgViewBox.style.transition = "all 0s";
    doTransform(delX, delY, zoomScale);
  }
});

imgViewer.addEventListener("mouseup", function (e) {
  console.log("mouseup");
  imgViewBox.style.transition = "all 0.2s";
});