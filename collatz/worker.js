function dostep(num, multiplier, offset) {
    return (num % 2n == 0) ? num / 2n : (multiplier * num) + offset
}

function collatz(start, multiplier, offset, maxsteps) {
    let seq = new Array(maxsteps + 1n).fill(null);
    seq[0] = start
    let next = dostep(start, multiplier, offset)
    seq[1] = next
    for (let i = 2; i < maxsteps + 1n; i++) {
        next = dostep(next, multiplier, offset)
        seq[i] = next
        if (checkIfLoops(seq, i, next)) {
            return seq.slice(0, i + 1)
        }
    }
    return seq
}

function checkIfLoops(seq, i, next) {
    return seq.slice(0, i).includes(next);
}

self.addEventListener('message', function (e) {
    let seq = collatz(e.data.startNum, e.data.multiplier, e.data.offset, e.data.maxsteps)
    postMessage({ 'seq': seq, 'base': e.data.base })
}, false)