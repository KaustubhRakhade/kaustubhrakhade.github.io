function buildTable(seq, next, base, loopPoint) {
    base = parseInt(base)
    let tablestr = ''
    let elem;
    for (i = 0; i < seq.length; i++) {
        elem = seq[i]
        tablestr += `<tr${i + next >= loopPoint ? ' class="loopTD"' : ''}><td>${i + next}</td><td>${elem}</td><td>${(elem).toString(base)}</td></tr>`
    }
    return (tablestr)
}

self.addEventListener('message', function (e) {
    console.time('Table built till ' + e.data.next)
    tablestr = buildTable(e.data.seq, e.data.next - 100, e.data.base,  e.data.loopPoint)
    console.timeEnd('Table built till ' + e.data.next)
    postMessage({
        'tablestr': tablestr,
        'next': e.data.next,
        'base': e.data.base,
        'loopPoint': e.data.loopPoint
    })
}, false)