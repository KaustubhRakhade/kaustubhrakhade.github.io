function buildTable(seq, next, base) {
    base = parseInt(base)
    let tablestr = ''
    let elem;
    for (i = 0; i < seq.length; i++) {
        elem = seq[i]
        tablestr += `<tr><td>${i + next}</td><td>${elem}</td><td>${(elem).toString(base)}</td></tr>`
    }
    return (tablestr)
}

self.addEventListener('message', function (e) {
    console.time('Table built till ' + e.data.next)
    tablestr = buildTable(e.data.seq, e.data.next - 100, e.data.base)
    console.timeEnd('Table built till ' + e.data.next)
    postMessage({ 'tablestr': tablestr, 'next': e.data.next, 'base': e.data.base})
}, false)