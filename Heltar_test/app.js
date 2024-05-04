const delay = 5000; //milliseconds
let currentFrame = 0;

const elements = document.querySelectorAll('#hero-images img');
const heroControl = document.querySelector('#hero-headers-controls');
console.log(heroControl);


function goToFrame(i) {
    heroControl.style.marginTop = `${-i * 6}rem`;
    elements.forEach((el, j) => {
        if (j === i) {
            el.classList.remove('hidden')
            el.classList.add('visible')
        }
        else {
            el.classList.remove('visible')
            el.classList.add('hidden')
        }
    })
}

var timeouts = []

for (let i = 0; i < elements.length; i++) {
  let t1 = setTimeout(() => {
    console.log(i);
    goToFrame(i);
  }, i * delay);
    timeouts.push(t1);
}

let scrollActive = true;

function scrollHandler(e) {
  if (scrollActive) {
    scrollActive = false;
    if (e.deltaY > 0) {
        currentFrame = Math.min(currentFrame + 1, elements.length - 1);
    }
    else {
        currentFrame = Math.max(currentFrame - 1, 0);
    }
    setTimeout(() => {
        scrollActive = true;
    }, 1000);
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
    for (let i = currentFrame+1; i < elements.length; i++) {
        let t1 = setTimeout(() => {
            console.log(i);
            goToFrame(i);
        }, 1000 + (i - currentFrame) * delay);
        timeouts.push(t1);
    }
    goToFrame(currentFrame);
      
  }
}



hero.addEventListener("wheel", scrollHandler);