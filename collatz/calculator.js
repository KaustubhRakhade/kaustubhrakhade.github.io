var seq_var = []

worker = new Worker("worker.js");
worker.onmessage = function (event) {
  seq_var = event.data.seq
  console.timeEnd('Calculation done')
  grab('#seq').innerHTML = `<table><th>Steps</th><th>Number</th><th>Base ${event.data.base}</th></table>`
  grab('#calculateBTN').value = 'Calculate'
  grab('#calculateBTN').disabled = false;
  tableWorker.postMessage({ 'seq': seq_var.slice(0, 100), 'next': 100, 'base': event.data.base })
  grab('#downloadBTN').style.display = 'flex';
  grab('#renderBTN').style.display = 'flex';
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
          'base': event.data.base
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
  console.log(parameters.base)
  if (parameters.base <= 36 && parameters.base >= 2) {
    return parameters
  }
  console.log('here')
  grab('#baseLimit').style.color = ''
  grab('#baseLimit').style.color = '#f00';
  showError('#base')
  setTimeout(() => { grab('#baseLimit').style.color = '#bbb' }, 2000)
  return null
}

function addTable(tablestr) {
  grab('#seq > table').style.display = 'table';
  let faketable = document.createElement('table')
  faketable.style.display = 'none';
  faketable.innerHTML = tablestr;
  grab('#seq').appendChild(faketable)
  if (document.querySelectorAll('#seq > table').length <= 2) {
    faketable.style.display = 'table';
  }
}

function renderChart() {
  let seq = seq_var;
  let ctx = document.createElement('canvas')
  ctx.style.display = 'none';
  let xData = new Array(seq.length).fill(null);
  let yData = new Array(seq.length).fill(null);
  let loopData = new Array(seq.length).fill(null);
  let loopJoin = new Array(seq.length).fill(null);
  loopPoint = seq.indexOf(seq.slice(-1)[0])
  for (i = 0; i < seq.length; i++) {
    xData[i] = i
    let y = parseInt(seq[i])
    if (i == loopPoint || i == seq.length - 1) {
      yData[i] = y
      loopData[i] = (y)
      loopJoin[i] = (y)
    }
    else if (i > loopPoint) {
      loopData[i] = (y)
    }
    else {
      yData[i] = y
    }
  }
  let data = {
    labels: xData,
    datasets: [{
      label: 'Steps',
      data: yData,
      fill: false,
      borderColor: 'rgb(0, 0, 255)',
      tension: 0,
      pointRadius: 0,
      pointHitRadius: 2,
      borderWidth: 1
    }, {
      label: 'Loop Steps',
      data: loopData,
      fill: false,
      borderColor: 'rgb(255, 0,0)',
      tension: 0,
      pointRadius: 0,
      pointHitRadius: 2,
      borderWidth: 2
    }, {
      label: 'Loop Back',
      data: loopJoin,
      fill: false,
      spanGaps: true,
      borderColor: 'rgb(255, 128,128)',
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
  // myChart.options.scales['yAxes'].ticks = {
    callback: function (value, index, values) {
      let order = Math.floor(Math.log10(Math.abs(value)))
      return order > 4 ? (value / 10 ** order).toFixed(1) + 'e' + order : value;
    }
  }
  myChart.options.plugins.legend.display = false;
  grab('#chart').innerHTML = '';
  grab('#chart').appendChild(ctx)
  ctx.style.display = 'block';
  grab('#renderBTN').style.display = 'none';
  grab('#renderBTN').disabled = false
  grab('#renderBTN > b').textContent = 'Render Chart'
}

function showError(id) {
  grab(id).classList = 'error'
  setTimeout(() => { grab(id).classList = '' }, 2000)
}

function calculate() {
  let parameters = extractParams(['#startNum', '#multiplier', '#offset', '#maxsteps', '#base'])
  if (parameters != null) {
    console.time('Calculation done')
    console.log(parameters)
    worker.postMessage(parameters)
    grab('#calculateBTN').disabled = true
    grab('#calculateBTN').value = 'Calculating'
    grab('#loader').style.display = 'flex';
  }
}

grab = (query) => { return document.querySelector(query) }

grab('#calculateBTN').addEventListener('click', (this, () => {
  grab('#downloadBTN').style.display = 'none';
  grab('#renderBTN').style.display = 'none';
  grab('#loader').style.display = 'none';
  try {
    grab("#seq").innerHTML = ''
    grab("#chart").innerHTML = ''
  } catch { }
  calculate()
}))

grab('#startNum').addEventListener('keydown', function (e) {
  if (e.key == 'Enter') {
    grab('#calculateBTN').click()
    e.preventDefault();
  }
});

grab('#renderBTN').addEventListener('click', function (e) {
  console.time('Rendered Chart')
  this.disabled = true
  grab('#renderBTN > b').textContent = 'Rendering'
  setTimeout(() => {
    renderChart()
    console.timeEnd('Rendered Chart')
  }, 10);
});

grab('#downloadBTN').addEventListener('click', function (e) {
  console.time('Downloaded CSV')
  this.disabled = true
  grab('#downloadBTN > b').textContent = 'Downloading'
  setTimeout(() => {
    downloadCSV()
    console.timeEnd('Downloaded CSV')
  }, 10);
});

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