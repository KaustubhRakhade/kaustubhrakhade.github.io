let puzzle = []
let freezedTiles = []
let blindTiles = []

let moves = 0;
let timeElapsed = 0;
let currTab = 1;
let solved = false;
let rows = 4
let columns = 4
const defaulTileDimension = 96;
let tileArt = {
    "bgURL": "assets/white.jpg",
    "aspectRatio": 1,
    "textColor": "#007AFF",
    "shadowColor": "#FFFFFF",
    "showImage": "false"
}

const qS = (e) => { return document.querySelector(e); }
const qSA = (e) => { return document.querySelectorAll(e); }

//toggle visibility of "Play", "Leaderboard" & "Settings" tab
function navigate(tab) {
    if (tab != currTab) {
        currTab = tab;

        qSA(".page").forEach((p) => {
            p.style.display = "none"
        })
        qSA(".page")[tab-1].style.display = "flex"

        // Play tab
        if (tab == 1) { newGame() }
    
        // Leaderboard tab
        if (tab == 2) { updateHighScoreTab() }
    }
}

//reset puzzle for a new game
function newGame() {

    //reset variables
    rows = parseInt(qS("#numRows").value);
    columns = parseInt(qS("#numCols").value);
    moves = 0;
    solved = false;
    
    //clear stray intervals and reset variables
    try { clearInterval(timer); } catch {}
    try { clearInterval(freezer) } catch {}
    try { clearInterval(blinder) } catch {}
    timeElapsed = 0;
    freezedTiles = []
    blindTiles = []

    //update page content
    qS("#move-track b").textContent = "0"
    qS("#time-track b").textContent = "0s"
    qS("#board").innerHTML = ""
    qS("#board").classList.remove("solved")
    qS("#shareBtn").style.display = "none";

    //build the puzzle
    generatePuzzle()
    drawBoard(false)  //drawing board before shuffle so that animation is shown
    shuffle(50);
    drawBoard(true)
}

//validate input for row & column size
function handleSizeInput(elem) {
    let val = parseInt(elem.value);
    let min = parseInt(elem.min)
    let max = parseInt(elem.max)

    //if user leaves input field empty
    if (isNaN(val) && document.activeElement != elem) {
        elem.value = elem.getAttribute("placeholder")
    }
    //clamp value b/w min & max
    else {
        elem.value = Math.max(min, Math.min(val, max))
    }
}

//returns a solved puzzle of required size
function generatePuzzle() {

    puzzle = []
    let i=1;

    for (let y=0; y<rows; y++) {
        puzzle.push([])
        for (let x=0; x<columns; x++) {
            puzzle[y].push(i);
            i++;
        }
    }

    //empty tile is represented by 0
    puzzle[rows-1][columns-1] = 0;
}

/*

Assume a checkerboard colouring.
Then starting with a solvable puzzle (permutation parity even)
The following swaps are possible:

1. Any two numbers: parity is reversed.
2. A space with any number on a square of the same colour: parity is reversed.
3. A space with any number on a square of the opposite colour: parity is unchanged.

At the end, parity should be even (so that it's solvable)

*/
function shuffle(times) {

    solvable = true;
    let shuffledPuzzle = JSON.parse(JSON.stringify(puzzle)); //deep copy the puzzle variable
    
    for (let i=0; i<times || !solvable; i++) {

        //get two distinct tiles (x1, y1) & (x2, y2)
        x1 = randInt(0, columns)
        y1 = randInt(0, rows)
        do {
            x2 = randInt(0, columns)
            y2 = randInt(0, rows)   
        } while (x1 == x2 && y1 == y2)


        if (shuffledPuzzle[y1][x1] * shuffledPuzzle[y2][x2] == 0) { //1. A space with
            if ((y1 + x1) % 2 == (y2 + x2) % 2) {                   //any number on square of same colour:
                solvable = !solvable                                //parity is reversed
            }
        }
        else {                    //2. Any two numbers:
            solvable = !solvable  //parity is reversed
        }

        //swap tiles
        temp = shuffledPuzzle[y1][x1]
        shuffledPuzzle[y1][x1] = shuffledPuzzle[y2][x2]
        shuffledPuzzle[y2][x2] = temp
    }

    //rare case if after shuffling, the puzzle is already solved
    if (JSON.stringify(shuffledPuzzle) == JSON.stringify(puzzle)) {
        shuffle(times)
    }
    else {
        puzzle = shuffledPuzzle
    }
}

//makes move when clicked on tile at (x,y)
//returns true if valid move
function makeMove(x, y) {

    if (puzzle[y][x] == 0 || solved) {
        return false;
    }

    puzzleSnapshot = JSON.parse(JSON.stringify(puzzle))

    //find coordinates of zero
    let zero_x, zero_y
    puzzle.forEach((row, y) => {
        row.forEach((num, x) => {
            if (num == 0) {
                zero_x = x
                zero_y = y
            }
        })
    })

    //check in row
    if (y == zero_y) {

        for (let i=zero_x; i!=x;) {
            //shifting tiles
            puzzle[y][i] = zero_x < x ? puzzle[y][++i] : puzzle[y][--i];

            //check for freezed tile
            if (freezedTiles.includes(puzzle[y][i])) {
                puzzle = puzzleSnapshot;
                return false;
            }
        } 

        //last tiles shifted would be zero
        puzzle[y][x] = 0;
        return true;
    }

    //check in column
    if (x == zero_x) {
        for (let i=zero_y; i!=y;) {
            puzzle[i][x] = zero_y < y ? puzzle[++i][x] : puzzle[--i][x];

            if (freezedTiles.includes(puzzle[i][x])) {
                puzzle = puzzleSnapshot;
                return false;
            }
        }  

        puzzle[y][x] = 0;
        return true;
    }

    return false
}

function puzzleSolved() {
    
    //clear stray intervals and reset variables
    try { clearInterval(timer); } catch {}
    try { clearInterval(freezer) } catch {}
    try { clearInterval(blinder) } catch {}
    freezedTiles = []
    blindTiles = []
    solved = true;

    //update page contents
    drawBoard(false)
    if (tileArt.showImage == "true") {
        qS("#board").classList.add("solved")
    }
    qS("#shareBtn").style.display = "flex";

    //play confetti
    qS("video").style.display = "block";
    qS("video").currentTime = 0;
    qS("video").play();
    setTimeout(() => {
        qS("video").style.display = "none";
        qS("video").currentTime = 0;
    }, 5000);

    //push score to localStorage
    highScores = JSON.parse(localStorage.getItem("highscores")) || [];
    highScores.push({
        "time": timeElapsed,
        "moves": moves,
        "rows": rows,
        "columns": columns
    })
    localStorage.setItem("highscores", JSON.stringify(highScores));
}

//draws board in the page and optionally check for solved
function drawBoard(checkWin) {

    calcBoardDimensions()

    //populate the board with tiles
    if (qS("#board").innerHTML == "") {
        puzzle.forEach((row, y) => {
            row.forEach((num, x) => {
                qS("#board").appendChild(getNewTile(x,y))
            })
        })
    }

    numCorrect = 0;
    allTiles = qSA(".tile")

    puzzle.forEach((row, y) => {
        row.forEach((num, x) => {

            let tile = document.getElementById("tile" + num);

            tile.style.top = (y * tileDimension) + "px"
            tile.style.left = (x * tileDimension) + "px"
            
            //make correct tiles green
            if (num == 1 + y*columns + x) {
                numCorrect++;
                tile.children[0].style.color = "#28cd41" //green
            }
            else {
                tile.children[0].style.color = tileArt.textColor;
            }

            //toggles "blinded" class
            if (blindTiles.includes(num)) {
                tile.classList.add("blinded")
            }
            else {
                tile.classList.remove("blinded")
            }

            //toggles "freezed" class
            if (freezedTiles.includes(num)) {
                tile.classList.add("freezed")
                tile.setAttribute("onclick", "")
            }
            else {
                tile.classList.remove("freezed")
                tile.setAttribute("onclick", `handleClick(${x}, ${y})`)
            }
        })
    })

    //check for solved puzzle
    if (checkWin && numCorrect == rows * columns - 1) {
        puzzleSolved();
    }
}

//returns a tile object at given coordinates
function getNewTile(x, y) {

    let newTile = document.createElement("div")
    let newTileContent = document.createElement("div")
    newTileContent.classList.add("tile-content");
    newTileContent.textContent = puzzle[y][x]
    newTileContent.style.color = tileArt.textColor;
    newTileContent.style.textShadow = "0 0 0.5rem " + tileArt.shadowColor;

    //adjust image size to fit the entire puzzle
    if (tileArt.aspectRatio > 1) {
        zoomLevel = 100*Math.max(columns, rows*tileArt.aspectRatio)
        newTile.style.backgroundSize = `${zoomLevel}% ${zoomLevel/tileArt.aspectRatio}%`
    }
    else {
        zoomLevel = 100*Math.max(rows, columns/tileArt.aspectRatio)
        newTile.style.backgroundSize = `${zoomLevel*tileArt.aspectRatio}% ${zoomLevel}%`
    }

    newTile.style.backgroundImage = "url('" + tileArt.bgURL + "')"
    newTile.style.backgroundPositionX = (-100*x) + "%"
    newTile.style.backgroundPositionY = (-100*y) + "%"

    newTile.classList.add("tile");
    newTile.setAttribute("id", `tile${puzzle[y][x]}`)
    newTile.setAttribute("onclick", `handleClick(${x}, ${y})`)

    newTile.style.height = tileDimension + "px"
    newTile.style.width = tileDimension + "px"
    newTile.style.fontSize = tileDimension/2.5 + "px"

    //hide "0" tile
    if (puzzle[y][x] == 0) {
        newTile.style.opacity = 0;
    }
    
    newTile.appendChild(newTileContent);
    return newTile
}

//compute side of a tile such that everything fits in page
function calcBoardDimensions() {
    tileDimension = defaulTileDimension;

    //leave 32px horizontally & 224px vertically
    while (
        columns * tileDimension > document.body.clientWidth  - 32  ||
           rows * tileDimension > document.body.clientHeight - 224
    ) {
        tileDimension--;
    }

    //update dimensions of components
    qS("#board").style.height = (rows * tileDimension) + "px";
    qS("#board").style.width = (columns * tileDimension)  + "px";
    qSA(".tile").forEach((e) => {
        e.style.height = tileDimension + "px";
        e.style.width = tileDimension + "px";
        e.style.fontSize = tileDimension/2.5 + "px";
    })
}

//returns random int b/w min (included) & max (excluded)
function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min))
}

//assign some random numbers as frozen
function updateFreeze() {
    freezedTiles = []
    for (i=0; i<Math.floor(Math.sqrt(rows*columns)); i++) {
        freezedTiles.push(randInt(1, rows*columns));
    }  //we don't care about duplicates as it adds more randomness
    drawBoard()
}

//assign some random numbers as hidden
function updateBlind() {
    blindTiles = []
    for (i=0; i<Math.floor(Math.sqrt(rows*columns)); i++) {
        blindTiles.push(randInt(1, rows*columns));
    }
    drawBoard()
}

function updateHighScoreTab() {
    data = JSON.parse(localStorage.getItem("highscores")) || [];
    sizes = []
    data.forEach((game) => {
        size = game.rows + "x" + game.columns;
        if (!sizes.includes(size)) {
            sizes.push(size);
        }
    })
    sizes.sort()

    qS("#menu").innerHTML = `
        <span class="menu-item"
            onclick="filterHighScores(this.getAttribute('value'))"
            value="all">All sizes</span>`

    sizes.forEach((s) => {
        r = s.split("x")[0]
        c = s.split("x")[1]
        qS("#menu").innerHTML += `
            <span class="menu-item"
                onclick="filterHighScores(this.getAttribute('value'))"
                value="${s}">${r} by ${c}</span>`
    })

    filterHighScores("all")
}

function filterHighScores(size) {
    
    data = JSON.parse(localStorage.getItem("highscores")) || [];

    //filter data by size
    if (size != "all") {
        data = data.filter((game) => {
            return (game.rows + "x" + game.columns == size)
        })
    }

    //assign click handler to each menu item
    qSA("input[name=sort-by]").forEach((elem) => {
        elem.setAttribute("onchange", `filterHighScores("${size}")`)
    })

    sortParam = qS("input[name=sort-by]:checked").getAttribute("id") == "by-time" ? "time" : "moves"

    //sort data by sort parameter
    data.sort((a,b) => {
        if (a[sortParam] > b[sortParam]) {
            return 1
        }
        else if (a[sortParam] < b[sortParam]) {
            return -1;
        }

        //if tie in time, check moves & vice versa
        else if (a[sortParam == "time" ? "moves" : "time"] > b[sortParam == "time" ? "moves" : "time"]) {
            return 1
        }
        else {
            return -1
        }
    })

    //populate leaderboard
    qS("#list-items").innerHTML = ""
    data.forEach((game, i) => {

        infoString = [
            sortParam == "time" ? game.time + "s" : game.moves + " moves",
            sortParam == "moves" ? game.time + "s" : game.moves + " moves"
        ]
        qS("#list-items").innerHTML += `
            <div class="list-item">
                <span class="score-rank">${i+1}</span>
                <span class="score-info"><b>${infoString[0]}</b><i>${infoString[1]}</i></span>
                <span class="score-size">${game.rows} × ${game.columns}</span>
            </div>`
    })

    qSA("#pull-down-btn span")[0].textContent = size == "all" ? "All sizes" : size.replace("x", " by ")
    qS("#empty-scores").style.display = data.length == 0 ? "block" : "none"
}

// convert image file to base64 string
const reader = new FileReader();
reader.addEventListener("load", () => {
    let img = new Image();
    img.onload = () => {

        tileArt = {
            "bgURL": reader.result,
            "aspectRatio": img.width/img.height,
            "textColor": "#FFFFFF",
            "shadowColor": "#000000",
            "showImage": "true"
        }
    }
    img.src = reader.result
    qS("#custom-image").classList.add("active")
}, false);

//set tile background image
function setTileArt(elem) {

    //toggle "active" class
    qSA("#choose-image > *").forEach((e) => {
        e.classList.remove("active")
    })
    elem.classList.add("active")

    //if user-selected image
    if (elem.tagName == "INPUT") {
        let file = elem.files[0]
        if (file) {
           reader.readAsDataURL(file);
        }
    }

    //if predefined image
    else {
        tileArt = {
            "bgURL": elem.src,
            "aspectRatio": elem.getAttribute("aspectRatio"),
            "textColor": elem.getAttribute("textColor"),
            "shadowColor": elem.getAttribute("shadowColor"),
            "showImage": elem.getAttribute("showImage")
        }
    }
}

//share functions
function shareRes() {
    navigator.share({
        title: "15puzzle",
        text: `I solved a ${rows} by ${columns} "15puzzle" in just ${timeElapsed} seconds!
See if you can beat me on
${window.location.href}`
    })
}

function updateTimer() {
    timeElapsed++;
    qS("#time-track b").textContent = timeElapsed + "s"
}

function handleClick(x, y) {

    if (makeMove(x,y)) { //if valid move

        //if first move
        if (moves == 0) {
            timeElapsed = 0;
            timer = setInterval(updateTimer, 1000);

            if (qS("#freeze-challenge").checked) {
                freezer = setInterval(updateFreeze, 4000);
            }
            if (qS("#blind-challenge").checked) {
                blinder = setInterval(updateBlind, 4000);
            }
        }

        moves++;
        qS("#move-track b").textContent = moves;

        drawBoard(true)
    }
}

//responsive design
window.addEventListener("resize", (e) => {
    calcBoardDimensions()
    drawBoard()
})

//makes moves based on direction (up, down, left, right)
function handleDirectionalInput(dir) {

    //find zero tile
    zeroTile = new Object();
    puzzle.forEach((row, y) => {
        row.forEach((num, x) => {
            if (num==0) {
                zeroTile = {
                    "x": x,
                    "y": y
                }
            }
        })
    })

    switch (dir) {
        case "ArrowUp":
            if (zeroTile.y != rows-1) {
                handleClick(zeroTile.x, zeroTile.y+1)
            }
            break;

        case "ArrowDown":
            if (zeroTile.y != 0) {
                handleClick(zeroTile.x, zeroTile.y-1)
            }
            break;

        case "ArrowRight":
            if (zeroTile.x != 0) {
                handleClick(zeroTile.x-1, zeroTile.y)
            }
            break;

        case "ArrowLeft":
            if (zeroTile.x != columns-1) {
                handleClick(zeroTile.x+1, zeroTile.y)
            }
            break;

        default:
            break;
    }
}

window.addEventListener("keydown", (e) => {
    handleDirectionalInput(e.key)
})

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

startTouch = null;

//handle swipe
function handleTouchStart(e) {
    startTouch = {
        "x": e.touches[0].clientX,
        "y": e.touches[0].clientY,
    }
}

//handle swipe
function handleTouchMove(e) {
    threshold = 50;
    if (startTouch != null) {

        if (startTouch.y - e.touches[0].clientY > threshold) {
            startTouch = null;
            handleDirectionalInput("ArrowUp")
        }

        else if (startTouch.y - e.touches[0].clientY < -threshold) {
            startTouch = null;
            handleDirectionalInput("ArrowDown")
        }

        else if (startTouch.x - e.touches[0].clientX > threshold) {
            startTouch = null;
            handleDirectionalInput("ArrowLeft")
        }

        else if (startTouch.x - e.touches[0].clientX < -threshold) {
            startTouch = null;
            handleDirectionalInput("ArrowRight")
        }

    }
}

newGame()