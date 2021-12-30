var seq_var = []

worker = new Worker("worker.js");
worker.onmessage = function (event) {
  seq_var = event.data.seq
  loopPoint = seq_var.indexOf(seq_var.slice(-1)[0])
  loopPoint = (loopPoint == seq_var.length - 1) ? seq_var.length : loopPoint
  console.timeEnd('Calculation done')
  grab('#seq').innerHTML = `<table><th>Steps</th><th>Number</th><th>Base ${event.data.base}</th></table>`
  grab('#calculateBTN').value = 'Calculate'
  grab('#calculateBTN').disabled = false;
  tableWorker.postMessage({
    'seq': seq_var.slice(0, 100),
    'next': 100,
    'base': event.data.base,
    'loopPoint': loopPoint
  });
  summarize();
  grab('#button-container').style.display = 'flex';
};

tableWorker = new Worker("table.js");
tableWorker.onmessage = function (event) {
  let newtablestr = event.data.tablestr
  addTable(newtablestr)
  if (event.data.next >= seq_var.length) {
    grab('#loader').style.display = 'none';
  }
  window.onscroll = () => {
    grab('#backToTop').style.marginRight = window.pageYOffset < 16 ? '-5rem' : '0'
    if ((window.innerHeight + window.pageYOffset + 100) >= document.body.offsetHeight) {
      for (table of document.querySelectorAll('#seq > table')) {
        if (table.style.display == 'none') {
          table.style.display = 'table'
          break
        }
      }
      if (event.data.next < seq_var.length) {
        tableWorker.postMessage({
          'seq': seq_var.slice(event.data.next, event.data.next + 100),
          'next': event.data.next + 100,
          'base': event.data.base,
          'loopPoint': event.data.loopPoint 
        })
      }
      else {
        grab('#loader').style.display = 'none';
      }
    }
  };
}

function extractParams(ids) {
  let parameters = {}
  for (id of ids) {
    let rawnumberstr = grab(id).value
    var numberstr = "";
    if (rawnumberstr[0] == '-') { numberstr = '-' }
    for (var i = 0; i < rawnumberstr.length; i++) {
      var ch = rawnumberstr.charCodeAt(i);
      if (ch >= 48 && ch <= 57)
        numberstr += rawnumberstr.substr(i, 1);
    }
    while (numberstr.length > 0 && numberstr.substr(0, 1) == "0")
      numberstr = numberstr.substring(1);
    try {
      parameters[id.slice(1)] = BigInt(numberstr == '' ? null : numberstr)
    } catch (err) {
      if (id == '#offset' || id == '#base') {
        parameters[id.slice(1)] = 0n;
      }
      else {
        showError(id)
        return null
      }
    }
  }
  if (parameters.base <= 36 && parameters.base >= 2) {
    return parameters
  }
  grab('#baseLimit').style.color = '#f22';
  showError('#base')
  setTimeout(() => { grab('#baseLimit').style.color = '#bbb' }, 2000)
  return null
}

function addTable(tablestr) {
  grab("#seq").style.display = 'block';
  grab('#seq > table').style.display = 'table';
  let faketable = document.createElement('table')
  faketable.style.display = 'none';
  faketable.innerHTML = tablestr;
  grab('#seq').appendChild(faketable)
  if (document.querySelectorAll('#seq > table').length <= 2) {
    faketable.style.display = 'table';
  }
}

var seq_num = []
function summarize() {
  if (seq_num.length == 0) {
    seq_num = seq_var.map((value) => {return Number(value)})
  }
  grab('#summary tr:nth-child(3) v').textContent = seq_num.length - 1;
  [multiplier, offset] = grab('#summary tr:nth-child(2) v').textContent.split('n')
  multiplier = BigInt(multiplier)
  offset = BigInt(offset)
  grab('#converge-loop').style.display = 'none'
  grab('#converge-unknown').style.display = 'none'
  grab('#converge-inf').style.display = 'none'
  loopPoint = seq_var.slice(0,-1).indexOf(seq_var.slice(-1)[0])
  console.log(loopPoint, multiplier + offset)
  if (loopPoint >= 0) {
    console.log(seq_num.slice(loopPoint, -1))
    loopMin = Math.min(...seq_num.slice(loopPoint, -1)).toString(36)
    grab('#converge-loop').style.display = 'flex'
    grab('#converge-loop > span:nth-child(2) v').textContent = seq_num.length - loopPoint - 1
    grab('#converge-loop > span:nth-child(3) v').textContent = `${multiplier.toString(36)}${offset<0 ? '' : '+'}${offset.toString(36)}_${loopMin}`
  } else if ((multiplier + offset) % 2n == 1n) {
    grab('#converge-inf').style.display = 'flex'
  } else {
    grab('#converge-unknown').style.display = 'flex'
  }

}

function renderChart() {
  console.time('comp')
  if (seq_num.length == 0) {
    seq_num = seq_var.map((value) => {return Number(value)})
  }
  console.timeEnd('comp')
  let seq = seq_var;
  loopPoint = seq.indexOf(seq.slice(-1)[0])
  let ctx = document.createElement('canvas')
  ctx.style.display = 'none';
  let xData = new Array(seq.length).fill()
  xData = xData.map((value, index) => { return (index)})
  let yData = seq_num.slice(0, loopPoint+1)
  let loopData = new Array(loopPoint).fill().concat(seq_num.slice(loopPoint))
  let loopJoin = new Array(seq.length).fill();
  loopJoin[loopPoint] = seq_num[loopPoint]
  loopJoin[seq.length-1] = seq_num[seq.length-1]
  let data = {
    labels: xData,
    datasets: [{
      label: 'Steps',
      data: yData,
      fill: false,
      borderColor: 'rgb(0,127,255)',
      tension: 0,
      pointRadius: 0,
      pointHitRadius: 2,
      borderWidth: 1
    }, {
      label: 'Loop Steps',
      data: loopData,
      fill: false,
      borderColor: 'rgb(255,31,31)',
      tension: 0,
      pointRadius: 0,
      pointHitRadius: 2,
      borderWidth: 2
    }, {
      label: 'Loop Back',
      data: loopJoin,
      fill: false,
      spanGaps: true,
      borderColor: 'rgb(255,127,127)',
      tension: 0,
      pointRadius: 0,
      pointHitRadius: 2,
      borderWidth: 2
    }]
  }
  let myChart = new Chart(ctx, {
    type: 'line',
    data: data
  });
  myChart.options.scales['y'].ticks = {
    callback: function (value, index, values) {
      let order = Math.floor(Math.log10(Math.abs(value)))
      return order > 4 ? (value / 10 ** order).toFixed(1) + 'e' + order : value;
    }
  }
  myChart.options.plugins.legend.display = false;
  grab('#chart').innerHTML = '';
  grab('#chart').appendChild(ctx)
  ctx.style.display = 'block';
  grab("#chart").style.display = 'block'
  grab('#renderBTN').disabled = false
  grab('#renderBTN > b').textContent = 'Render Chart'
}

function showError(id) {
  grab(id).classList = 'error'
  setTimeout(() => { grab(id).classList = '' }, 2000)
}

function calculate() {
  let parameters = extractParams(['#startNum', '#multiplier', '#offset', '#maxsteps', '#base'])
  seq_num = []
  seq_var = []
  if (parameters != null) {
    console.time('Calculation done')
    console.log(parameters)
    worker.postMessage(parameters)
    grab('#calculateBTN').disabled = true
    grab('#calculateBTN').value = 'Calculating'
    grab('#loader').style.display = 'flex';
    grab('#summary tr:nth-child(1) v').textContent = parameters.startNum
    grab('#summary tr:nth-child(2) v').textContent = `${parameters.multiplier}n${parameters.offset < 0 ? '' : '+'}${parameters.offset}`
  }
}

grab = (query) => { return document.querySelector(query) }

grab('#calculateBTN').addEventListener('click', (this, () => {
  grab('#button-container').style.display = 'none';
  grab('#loader').style.display = 'none';
  try {
    grab("#seq").innerHTML = ''
    grab("#seq").style.display = 'none';
    grab("#chart").innerHTML = ''
    grab("#chart").style.display = 'none';
  } catch { }
  calculate()
}))

grab('#startNum').addEventListener('keydown', (e) => {
  if (e.key == 'Enter') {
    grab('#calculateBTN').click()
    e.preventDefault();
  }
});

grab('#renderBTN').addEventListener('click', () => {
  console.time('Rendered Chart')
  grab('#renderBTN').disabled = true
  grab('#renderBTN > b').textContent = 'Rendering'
  setTimeout(() => {
    renderChart()
    console.timeEnd('Rendered Chart')
  }, 50);
});

grab('#downloadBTN').addEventListener('click', () => {
  console.time('Downloaded CSV')
  grab('#downloadBTN').disabled = true
  grab('#downloadBTN > b').textContent = 'Downloading'
  setTimeout(() => {
    downloadCSV()
    console.timeEnd('Downloaded CSV')
  }, 50);
});

// When the user clicks on the button, scroll to the top of the document
grab('#backToTop').addEventListener('click', () => {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
});

grab('#summaryBTN').addEventListener('click', () => {
  console.log('clicked o summary')
  grab('#summary-bg').style.display = 'flex';
});

grab('#summary-top > span').addEventListener('click', () => {
  grab('#summary-bg').style.display = 'none';
});

grab('#summary-bg').addEventListener('click', () => {
  if (grab('#summary:hover') == null) {
    grab('#summary-bg').style.display = 'none';
  }
});

for (tooltip of document.querySelectorAll('tooltip')) {
  content = tooltip.innerHTML;
  tooltip.innerHTML = `<span class="material-icons">info</span>
  <span>${content}</span>`
}

function downloadCSV() {
  let csvText = seq_var.join('%0A')
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + csvText);
  element.setAttribute('download', 'collatz.csv');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  grab('#downloadBTN > b').textContent = 'Download'
  grab('#downloadBTN').disabled = false;
}