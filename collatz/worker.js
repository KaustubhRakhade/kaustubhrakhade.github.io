function dostep(number, multiplier, offset) {
    var limit = 1000000;
    num = JSON.parse(JSON.stringify(number));
    sign = Math.sign(num[num.length - 1])
    if (num[0] % 2 == 0) {
        // first regroup to make all elements even
        for (var i = 1; i < num.length; i++) {
            if (num[i] % 2 == sign) {
                num[i] -= sign;
                num[i - 1] += sign*limit;
            }
        }
        // now divide
        for (var i = 0; i < num.length; i++) {
            num[i] /= 2;
        }
        if (num[num.length - 1] == 0) {  // remove largest element
            num.pop();
        }
    }
    else {
        // multiply all elements
        for (var i = 0; i < num.length; i++) {
            num[i] *=  multiplier;
        }
        num[0] += offset;
        // now regroup
        num.push(0);
        for (var i = 0; i < num.length - 1; i++) {
            let sign = Math.sign(num[i])
            num[i+1] += sign*Math.floor(num[i] / (limit*sign));
            num[i] %= limit;
        }
        if (num[num.length - 1] == 0) {  // remove largest element
            num.pop();
        }
    }
    return num;
}


function collatz(start, multiplier, offset, maxsteps) {
    let seq = [{"num": start, "step": 0}]
    let next = dostep(start, multiplier, offset)
    let steps = 1;
    seq.push({"num": next, "step": steps})
    console.log(next, start)
    while (!(checkIfLoops(seq) || steps > maxsteps)) {
        console.log(seq)
        next = dostep(next, multiplier, offset)
        steps++
        seq.push({"num": next, "step": steps})
    }
    return(seq)
}

function checkIfLoops(seq) {
    let lastElem = JSON.stringify(seq[seq.length-1].num)
    for (i=0; i<seq.length - 1; i++) {
        if (lastElem == JSON.stringify(seq[i].num)) {
            return true
        }
    }
    return false
}

self.addEventListener('message', function(e) {
    console.log(e.data)
    postMessage(collatz(e.data.start, e.data.multiplier, e.data.offset, e.data.maxsteps))
}, false)