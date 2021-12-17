var message = ''

function formatnumber(n) {
  var s = '00000' + n.toString();
  return s.substr(s.length - 6, 6);
}
function numtostring(num) {
  sign = Math.sign(num[num.length - 1])
  var str = '';
  for (var i = 0; i < num.length - 1; i++) {
    str = formatnumber(sign*num[i]) + str;
  }
  str = sign*num[num.length - 1] + str;
  str = (sign == 1) ? str : '-' + str
  return (str === 'undefined') ? '0' : str;
}

function numtobinary(number) {
  sign = Math.sign(number[number.length - 1])
  var str = "";
  var count = 0;
  var num = [];
  // preserve number array!
  for (var i = 0; i < number.length; i++) {
    num[i] = sign*number[i];
  }
  do {
    if (num[0] & 1)
      str = "1" + str;
    else
      str = "0" + str;
    count++;
    if (count % 10 == 0)
      str = str;
    num[0] &= ~1;
    // first regroup to make all elements even
    for (var i = 1; i < num.length; i++) {
      if (num[i] % 2 == 1) {
        num[i]--;
        num[i - 1] += 1000000;
      }
    }
    // now divide
    for (var i = 0; i < num.length; i++) {
      num[i] /= 2;
    }
    if (num[num.length - 1] == 0)  // remove last element
      num.pop();
  } while (num.length > 0);
  return (sign == 1) ? str : '-'+str;
}

function getnumber(rawnumberstr) {
  var numberstr = "";
  if (rawnumberstr[0] === '-') {
    numberstr = '-'
  }
  for (var i = 0; i < rawnumberstr.length; i++) {
    var ch = rawnumberstr.charCodeAt(i);
    if (ch >= 48 && ch <= 57 )
      numberstr += rawnumberstr.substr(i, 1);
  }
  while (numberstr.length > 0 && numberstr.substr(0, 1) == "0")
    numberstr = numberstr.substring(1);
  return((numberstr == "") ? 0 : numberstr);
}

function strtonumber(numstr) {
  var num = [];
  let sign = 1;
  if (numstr[0] === '-') {
      numstr = numstr.substring(1, numstr.length)
      sign = -1;
  }
  while (numstr.length > 6) {
    num.push(sign*parseInt(numstr.substr(numstr.length - 6, 6), 10));
    numstr = numstr.substring(0, numstr.length - 6);
  }
  if (numstr.length > 0) {
    num.push(sign*parseInt(numstr)); 
  }
  return num;
}

function buildTable(seq) {
    let table = document.createElement('table')
    let lastElem = JSON.stringify(seq[seq.length-1].num)
    var loopStart = false
    var loopPoint = null;
    table.innerHTML = `<th>Steps</th><th>Number</th><th class='bin'>Binary</th>`
    for (i=0; i<seq.length-1; i++) {
        let elem = seq[i]
        let row = document.createElement('tr')
        if (lastElem == JSON.stringify(elem.num) && !loopStart) {
            loopStart = true
            loopPoint = i;
        }
        if (loopStart) {
          row.classList = 'loopTD'
        }
        
        row.innerHTML = `<td>${elem.step}</td><td>${numtostring(elem.num)}</td><td class='bin'>${numtobinary(elem.num)}</td>`
        table.appendChild(row)
    }
    renderChart(seq, loopPoint)
    grab('#seq').innerHTML = ''
    grab('#seq').appendChild(table)
    show = grab('#showBin').checked
    grab("#binaryStyle").innerHTML = `.bin { display: ${show ? 'table-cell' : 'none'} !important }`
    grab('#calculateBTN').value = 'Calculate'
    grab('#calculateBTN').disabled = false;
    console.timeEnd(message)
}

function renderChart(seq, loopPoint) {
  let ctx = document.createElement('canvas')
  let xData = [];
  let yData = [];
  let loopData = [];
  let loopJoin = [];
  for (i=0; i<seq.length; i++) {
    elem = seq[i]
    xData.push(elem.step)
    let y = parseInt(numtostring(elem.num))
    if (i == loopPoint || i == seq.length-1) {
      yData.push(y)
      loopData.push(y)
      loopJoin.push(y)
    }
    else if (i > loopPoint) {
      yData.push(null)
      loopData.push(y)
      loopJoin.push(null)
    }
    else {
      yData.push(y)
      loopData.push(null)
      loopJoin.push(null)
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
      pointHitRadius:5,
      borderWidth: 1
    },{
      label: 'Loop Steps',
      data: loopData,
      fill: false,
      borderColor: 'rgb(255, 0,0)',
      tension: 0,
      pointRadius: 0,
      borderWidth: 2
    },{
      label: 'Loop Back',
      data: loopJoin,
      fill: false,
      spanGaps: true,
      borderColor: 'rgb(255, 128,128)',
      tension: 0,
      pointRadius: 0,
      borderWidth: 2
    }]
  }
  let myChart = new Chart(ctx, {
    type: 'line',
    data: data
  });
  grab('#chart').innerHTML = '';
  grab('#chart').appendChild(ctx)
}

function calculate() {
    let offset = parseInt(getnumber(grab('#offset').value))
    let start = strtonumber(getnumber(grab('#startNum').value))
    let multiplier = parseInt(getnumber(grab('#multiplier').value))
    let maxsteps = parseInt(getnumber(grab('#maxsteps').value))
    message = `Start: ${getnumber(grab('#startNum').value)}
Format: ${multiplier}n${(Math.sign(offset) == 1) ? '+':''}${offset}
Max Steps: ${maxsteps}
Time Taken`;
    console.time(message)
    w.postMessage({'start':start,'multiplier':multiplier,'offset':offset,'maxsteps':maxsteps}) 
}

grab = (query) => {return document.querySelector(query)} 

grab('#calculateBTN').addEventListener('mousedown', (this, () => {
  grab('#calculateBTN').disabled = true
  grab('#calculateBTN').value = 'Calculating'
  try {
    grab("#seq").removeChild(grab('#seq > table'))
    grab("#chart").removeChild(grab('#chart > canvas'))
  } catch {}
    calculate()
}))

grab('#showBin').addEventListener('click', (this, () => {
  show = grab('#showBin').checked
  grab("#binaryStyle").innerHTML = `.bin { display: ${show ? 'table-cell' : 'none'} !important }`
}))

grab('#startNum').addEventListener('keydown', function(e) {
  if ( e.key == 'Enter') {
    calculate();
    e.preventDefault();
  }
});