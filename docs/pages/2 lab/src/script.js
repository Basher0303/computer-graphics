const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const polygon = new Path2D();

const removeBtnEl = document.getElementById("remove-btn");
const weightRangeEl = document.getElementById("weight-range");
const weightInputEl = document.getElementById("weight-input");
const colorStrokeInputEl = document.getElementById("color-stroke-input");
const hintLabelEl = document.getElementById("hint-label");
const shadowlineChkEl = document.getElementById("shadowline-checkbox");

const colorSupportLines = "#5C6FFF";
const colorShadowline = "#A6A6A6";

let pointsArr = [];

let isEditMode = true;
let movePoint = null;

canvas.width = 800;
canvas.height = 400;

function drawGrid() {
    const cellSize = 40;
    ctx.strokeStyle = "#cecece";
    for (var x = -0.5; x < canvas.width; x += cellSize) ctx.strokeRect(x, 0, 0.1, canvas.height);
    for (var y = -0.5; y < canvas.height; y += cellSize) ctx.strokeRect(0, y, canvas.width, 0.1);

    const axisSize = 2;
    ctx.fillStyle = "#000";
    ctx.fillRect((canvas.width - axisSize) / 2 , 0, axisSize, canvas.height);
    ctx.fillRect(0, (canvas.height - axisSize) / 2, canvas.width, axisSize);
}

function drawPolygon() {
    ctx.beginPath();
    ctx.strokeStyle = colorSupportLines;
    pointsArr.forEach((item, index) => {
        const absolutePos = getAbsolutePosition(item.x, item.y);
        if(index == 0) {
            ctx.moveTo(absolutePos.x, absolutePos.y);
        } else {
            ctx.lineTo(absolutePos.x, absolutePos.y);
        }
        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, 10, 0, 2 * Math.PI);
        ctx.stroke(circle);
        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = colorSupportLines;
        ctx.fill(circle);
    });
    ctx.stroke();
}

function drawBezier(w, isShadowline = false) {
    ctx.beginPath();
    ctx.strokeStyle = (isShadowline ? colorShadowline : colorStrokeInputEl.value);
    
    const x0 = pointsArr[0].x;
    const x1 = pointsArr[1].x;
    const x2 = pointsArr[2].x;

    const y0 = pointsArr[0].y;
    const y1 = pointsArr[1].y;
    const y2 = pointsArr[2].y;

    let t1 = 0.5*(1 + Math.sqrt((w+1)/(w-1)));
    let t2 = 0.5*(1 - Math.sqrt((w+1)/(w-1)));
    let isLineTo = true;

    for (let t = 0; t <= 1; t += 0.01) {
        if(w < -1) {
            if(t1 != 0 && t > t1) {
                t1 = 0;
                isLineTo = false;
                continue;
            }
            if(t2 != 0 && t > t2) {
                t2 = 0;
                isLineTo = false;
                continue;
            }
        }

        const d = Math.pow((1 - t), 2) + 2*w*t*(1 - t) + Math.pow(t, 2);

        const calcX = (Math.pow((1 - t), 2)*x0 + 2*w*t*(1 - t)*x1 + Math.pow(t, 2)*x2) / d;
        const calcY = (Math.pow((1 - t), 2)*y0 + 2*w*t*(1 - t)*y1 + Math.pow(t, 2)*y2) / d;

        const absolutePos = getAbsolutePosition(calcX, calcY);

        if(isLineTo == false) {
            isLineTo = true;
            ctx.moveTo(absolutePos.x, absolutePos.y);
        } else {
            ctx.lineTo(absolutePos.x, absolutePos.y);
        }

        // var circle = new Path2D();
        // circle.arc(absolutePos.x, absolutePos.y, 1, 0, 2 * Math.PI);
        // ctx.fillStyle = colorStrokeInputEl.value;
        // ctx.fill(circle);
    }

    const absolutePos2 = getAbsolutePosition(pointsArr[2].x, pointsArr[2].y);
    ctx.lineTo(absolutePos2.x, absolutePos2.y);

    ctx.stroke();
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPolygon();
    if(!isEditMode) {
        drawBezier(parseFloat(weightRangeEl.value));
        if(shadowlineChkEl.checked) {
            drawBezier(parseFloat(-1 * weightRangeEl.value), true);
        }
    }
}

function addPointsInPolygons() {
    const copyArr = JSON.parse(JSON.stringify(pointsArr));;
    let countAddedPoints = 0;

    for (let index = 0; index < copyArr.length; index++) {
        const currItem = copyArr[index];
        const nextItem = index != (copyArr.length-1) ? copyArr[index+1] : copyArr[0];
        const distance = getDistanceTwoPoints({x: currItem.oldX, y: currItem.oldY}, {x: nextItem.oldX, y: nextItem.oldY});
        const countNewPoints = Math.floor(distance / 10);
        if(countNewPoints > 0) {
            const range = distance / countNewPoints;
            for (let i = 1; i <= countNewPoints; i++) {
                const position = {
                    x: currItem.x + (nextItem.x - currItem.x) / distance * (i * range),
                    y: currItem.y + (nextItem.y - currItem.y) / distance * (i * range),
                };
                const newPoint = {
                    x: position.x,
                    y: position.y,
                    oldX: position.x,
                    oldY: position.y,
                };
                countAddedPoints += 1;
                pointsArr.splice(index + countAddedPoints, 0, newPoint);
            }
        }
    }
}


function getDistanceTwoPoints(pointOne, pointTwo) {
    return Math.sqrt(Math.pow(pointOne.x - pointTwo.x, 2) + Math.pow(pointOne.y - pointTwo.y, 2));
}

var getAbsolutePosition = function (x, y) {
    var midWidth = canvas.width / 2;
    var midHeight = canvas.height / 2;
    var cartesianX = midWidth + x;
    var cartesianY = midHeight - y;
  
    return {x: cartesianX, y: cartesianY};
}

var getCartesianPosition = function (x, y) {
    var midWidth = canvas.width / 2;
    var midHeight = canvas.height / 2;
    var absoluteX = x - midWidth;
    var absoluteY = midHeight - y;
  
    return {x: absoluteX, y: absoluteY};
  }


function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function Determinant(A)   // Используется алгоритм Барейса, сложность O(n^3)
{
    var N = A.length, B = [], denom = 1, exchanges = 0;
    for (var i = 0; i < N; ++i)
     { B[ i ] = [];
       for (var j = 0; j < N; ++j) B[ i ][j] = A[ i ][j];
     }
    for (var i = 0; i < N-1; ++i)
     { var maxN = i, maxValue = Math.abs(B[ i ][ i ]);
       for (var j = i+1; j < N; ++j)
        { var value = Math.abs(B[j][ i ]);
          if (value > maxValue){ maxN = j; maxValue = value; }
        }
       if (maxN > i)
        { var temp = B[ i ]; B[ i ] = B[maxN]; B[maxN] = temp;
          ++exchanges;
        }
       else { if (maxValue == 0) return maxValue; }
       var value1 = B[ i ][ i ];
       for (var j = i+1; j < N; ++j)
        { var value2 = B[j][ i ];
          B[j][ i ] = 0;
          for (var k = i+1; k < N; ++k) B[j][k] = (B[j][k]*value1-B[ i ][k]*value2)/denom;
        }
       denom = value1;
     }
    if (exchanges%2) return -B[N-1][N-1];
    else return B[N-1][N-1];
}

function AdjugateMatrix(A)   // A - двумерный квадратный массив
{                                        
    var N = A.length, adjA = [];
    for (var i = 0; i < N; i++)
     { adjA[ i ] = [];
       for (var j = 0; j < N; j++)
        { var B = [], sign = ((i+j)%2==0) ? 1 : -1;
          for (var m = 0; m < j; m++)
           { B[m] = [];
             for (var n = 0; n < i; n++)   B[m][n] = A[m][n];
             for (var n = i+1; n < N; n++) B[m][n-1] = A[m][n];
           }
          for (var m = j+1; m < N; m++)
           { B[m-1] = [];
             for (var n = 0; n < i; n++)   B[m-1][n] = A[m][n];
             for (var n = i+1; n < N; n++) B[m-1][n-1] = A[m][n];
           }
          adjA[ i ][j] = sign*Determinant(B);   // Функцию Determinant см. выше
        }
     }
    return adjA;
}


function InverseMatrix(A)   // A - двумерный квадратный массив
{   
    var det = Determinant(A);                // Функцию Determinant см. выше
    if (det == 0) return false;
    var N = A.length, A = AdjugateMatrix(A); // Функцию AdjugateMatrix см. выше
    for (var i = 0; i < N; i++)
     { for (var j = 0; j < N; j++) A[ i ][j] /= det; }
    return A;
}

canvas.addEventListener("click", e => {
    if(!isEditMode) return;

    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    pointsArr.push({
        x: cartesianPosition.x, 
        y: cartesianPosition.y,
    })
    
    

    if(pointsArr.length == 3) {
        isEditMode = false   
        hintLabelEl.innerHTML = "Измените значение веса или передвиньте опорные точки";
        weightRangeEl.removeAttribute("disabled")
        weightInputEl.removeAttribute("disabled")
    }
    renderCanvas()
});

canvas.addEventListener("mousedown", e => {
    if(isEditMode) return;
    
    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    const selectedPoint = pointsArr.find(el => {
        return getDistanceTwoPoints(el, cartesianPosition) < 10;
    })
    if(selectedPoint) {
        movePoint = selectedPoint;
    }
});


canvas.addEventListener("mouseup", e => {
    movePoint = null;
});

canvas.addEventListener("contextmenu", e => {
    e.preventDefault();
    if(isEditMode) return;

    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    console.log(cartesianPosition);


    const vector = {
        x: cartesianPosition.x - pointsArr[1].x,
        y: cartesianPosition.y - pointsArr[1].y,
    }
    const V = {
        x: pointsArr[0].x - pointsArr[1].x,
        y: pointsArr[0].y - pointsArr[1].y,
    }
    const W = {
        x: pointsArr[2].x - pointsArr[1].x,
        y: pointsArr[2].y - pointsArr[1].y,
    }


    const inverseMatrix = InverseMatrix([
        [V.x, V.y],
        [W.x, W.y]
    ]);

    const resultMatrix = [
        vector.x * inverseMatrix[0][0] + vector.y * inverseMatrix[1][0],
        vector.x * inverseMatrix[0][1] + vector.y * inverseMatrix[1][1]
    ];
    console.log(resultMatrix)

    const w = Math.sign(resultMatrix[0]) * (1-resultMatrix[0]-resultMatrix[1]) / (2*Math.sqrt(resultMatrix[0]*resultMatrix[1]));
    
    console.log(w)
    if(!isNaN(w)) {
        weightInputEl.value = w;
        weightInputEl.dispatchEvent(new Event('input'));
    }
});

canvas.addEventListener("mousemove", (e) => {
    if(movePoint) {
        canvas.style.cursor = "pointer";

        const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);

        movePoint.x = cartesianPosition.x
        movePoint.y = cartesianPosition.y

        renderCanvas()
    } else {
        if(pointsArr.length == 3 && pointsArr.some(el => getDistanceTwoPoints(getCartesianPosition(e.offsetX, e.offsetY), el) < 10)){
            canvas.style.cursor = "pointer"
        } else {
            canvas.style.cursor = "crosshair"
        }
    }
    
    
});

removeBtnEl.addEventListener('click', () => {
    pointsArr = [];
    isEditMode = true;
    hintLabelEl.innerHTML = "Используйте мышку, чтобы поставить опорные точки";
    weightRangeEl.value = 0;
    weightInputEl.value = 0;
    weightRangeEl.setAttribute("disabled", true)
    weightInputEl.setAttribute("disabled", true)
    renderCanvas();
});

weightRangeEl.addEventListener('input', (e) => {
    weightInputEl.value = e.target.value;
    renderCanvas();
});

weightInputEl.addEventListener('input', (e) => {
    weightRangeEl.value = e.target.value
    renderCanvas();
})


colorStrokeInputEl.addEventListener('input', (e) => {
    renderCanvas();
})

shadowlineChkEl.addEventListener('change', (e) => {
    renderCanvas();
})


renderCanvas();

