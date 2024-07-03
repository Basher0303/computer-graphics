const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const polygon = new Path2D();

const removeBtnEl = document.getElementById("remove-btn");
const outsideRangeEl = document.getElementById("outside-range");
const outsideInputEl = document.getElementById("outside-input");
const insideRangeEl = document.getElementById("inside-range");
const insideInputEl = document.getElementById("inside-input");
const hintLabelEl = document.getElementById("hint-label");
const manyRaysChkEl = document.getElementById("many-rays-checkbox");

const colorSupportLines = "#5C6FFF";
const colorShadowline = "#A6A6A6";
const colorCircle = "#000000"
const colorRay = "#5C6FFF"

let pointsArr = [];

let circleProp = {
    center: null,
    radius: null,
    isEdit: true,
    isMove: false,
    isChangeRadius: false
}

let rayProp = {
    start: null,
    end: null,
    isEdit: true,
    movePoint: null
}

let cursorPos = {
    x: 0,
    y: 0
}


canvas.width = 800;
canvas.height = 400;



function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawCircle();
    if(rayProp.start) drawSourceRay();
    if(rayProp.start) {
        if(manyRaysChkEl.checked) {
            const countRays = 200;
            for (let i = 0; i < countRays; i += 1) {
                renderRay(rayProp.start, rotateVector(getUnitVector(rayProp.start, rayProp.end), 2*Math.PI / countRays * i));
            }
        } else {
            renderRay(rayProp.start, getUnitVector(rayProp.start, rayProp.end ? rayProp.end : cursorPos));
        }
    }
}

function drawGrid() {
    const cellSize = 40;
    ctx.strokeStyle = "#cecece";
    for (var x = -0.5; x < canvas.width; x += cellSize) ctx.strokeRect(x, 0, 0.1, canvas.height);
    for (var y = -0.5; y < canvas.height; y += cellSize) ctx.strokeRect(0, y, canvas.width, 0.1);

    // const axisSize = 2;
    // ctx.fillStyle = "#000";
    // ctx.fillRect((canvas.width - axisSize) / 2 , 0, axisSize, canvas.height);
    // ctx.fillRect(0, (canvas.height - axisSize) / 2, canvas.width, axisSize);
}


function drawSourceRay() {
    const absolutePos = getAbsolutePosition(rayProp.start.x, rayProp.start.y);

    ctx.beginPath();
    ctx.strokeStyle = colorRay;
    const countPeaks = 16;
    for (let i = 0, j = false; i < countPeaks; i += 1, j = !j) {
        const vect = rotateVector({x: 1, y: 0}, 2*Math.PI / countPeaks * i)
        if(i == 0) ctx.moveTo(absolutePos.x + vect.x * (j ? 10 : 5), absolutePos.y + vect.y * (j ? 10 : 5)); 
        else ctx.lineTo(absolutePos.x + vect.x * (j ? 10 : 5), absolutePos.y + vect.y * (j ? 10 : 5)); 
    }
    ctx.fillStyle = colorRay;
    ctx.fill();
    ctx.stroke(); 
}

function renderRay(point, vector) {
    const isInside = isPointInsideCircle(point, circleProp.center, circleProp.radius);
    const pointsInRay = [
        point,
        {x: point.x + vector.x, y: point.y + vector.y}
    ];
    const k = (pointsInRay[1].y - pointsInRay[0].y) / (pointsInRay[1].x - pointsInRay[0].x);
    const b = pointsInRay[0].y - k*pointsInRay[0].x;
    const x0 = circleProp.center.x;
    const y0 = circleProp.center.y;
    const r = circleProp.radius;


    const A = 1 + k*k;
    const B = 2*(k*b - x0 - y0*k);
    const C = x0*x0 + b*b - 2*y0*b + y0*y0 - r*r;

    const X1 = (-B + Math.sqrt(B*B - 4*A*C))/(2*A);
    const X2 = (-B - Math.sqrt(B*B - 4*A*C))/(2*A);

    let pointInCircle = [
        {x: X1, y: k*X1 + b},
        {x: X2, y: k*X2 + b}
    ];
    pointInCircle = pointInCircle.sort((a, b) => {
        return getDistanceTwoPoints(point, a) - getDistanceTwoPoints(point, b)
    });
    pointInCircle = pointInCircle.filter(a => {
        return !isNaN(a.x) && !isNaN(a.y) && Math.abs(getAngleBetweenVectors(
            {x: a.x - point.x, y: a.y - point.y},
            vector
        )) < 0.1
    })


    if(pointInCircle.length > 0) {
        const endPos = pointInCircle[0]; 
        const startAbsolutePos = getAbsolutePosition(pointsInRay[0].x, pointsInRay[0].y);
        const endAbsolutePos = getAbsolutePosition(endPos.x, endPos.y);

        if(!manyRaysChkEl.checked) {
            var circle = new Path2D();
            ctx.strokeStyle = colorRay;
            circle.arc(endAbsolutePos.x, endAbsolutePos.y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = colorRay;
            ctx.fill(circle);
            ctx.stroke(circle);  
        }

        ctx.beginPath();
        ctx.strokeStyle = colorRay;
        ctx.moveTo(startAbsolutePos.x, startAbsolutePos.y); 
        ctx.lineTo(endAbsolutePos.x, endAbsolutePos.y); 
        ctx.stroke(); 

        const n1 = parseFloat(outsideInputEl.value);
        const n2 = parseFloat(insideInputEl.value);
        const isLeft = pointLeftToVector(
            {x: endPos.x - circleProp.center.x, y: endPos.y - circleProp.center.y},
            {x: point.x - endPos.x, y: point.y - endPos.y }
        );
        const radiusVect = {
            x: circleProp.center.x - endPos.x,
            y: circleProp.center.y - endPos.y,
        };
        if(isInside) {
            radiusVect.x = radiusVect.x * -1;
            radiusVect.y = radiusVect.y * -1;
        }
        let angle = (isLeft  ? 1 : -1) * getAngleBetweenVectors(
            radiusVect,
            {x: endPos.x - point.x, y: endPos.y - point.y }
        );
        if(isInside) angle = angle * -1;
        const newAngle = Math.asin(Math.sin(angle) * (isInside ? n2 / n1 : n1 / n2));

        const rayVect = rotateVector(radiusVect, newAngle);

        // drawRay(endPos, rayVect, "red")
        // drawRay(circleProp.center, {x: endPos.x - circleProp.center.x, y: endPos.y - circleProp.center.y}, "blue")

        const nextUnitVect = setLengthVector(rayVect, 1)
        renderRay({x: endPos.x + nextUnitVect.x, y: endPos.y + nextUnitVect.y}, nextUnitVect);

    } else {
        drawRay(point, setLengthVector(vector, 1000), colorRay)
    }
}

function drawRay(point, vector, color) {
    const pointAbsolute = getAbsolutePosition(point.x, point.y)
    const endAbsolutePos = getAbsolutePosition(point.x + vector.x, point.y + vector.y);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(pointAbsolute.x, pointAbsolute.y); 
    ctx.lineTo(endAbsolutePos.x, endAbsolutePos.y); 
    ctx.stroke(); 
}

function drawCircle() {
    if(circleProp.isEdit) {
        if(circleProp.center) {
            ctx.strokeStyle = colorShadowline
            const absolutePos = getAbsolutePosition(circleProp.center.x, circleProp.center.y);
            var circle = new Path2D();

            circle.arc(absolutePos.x, absolutePos.y, getDistanceTwoPoints(circleProp.center, cursorPos), 0, 2 * Math.PI);
            ctx.stroke(circle);
        }
    } else {
        ctx.strokeStyle = colorCircle;
        const absolutePos = getAbsolutePosition(circleProp.center.x, circleProp.center.y);

        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, circleProp.radius, 0, 2 * Math.PI);
        ctx.stroke(circle);

        ctx.strokeStyle = colorShadowline

        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, 10, 0, 2 * Math.PI);
        ctx.stroke(circle);


        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = colorShadowline;
        ctx.fill(circle);

        ctx.stroke(circle);
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

function getUnitVector(start, end) {
    const vect = {
        x: end.x - start.x,
        y: end.y - start.y
    };
    const length = getLengthVector(vect)
    return {
        x: vect.x / length,
        y: vect.y / length,
    }
}

function setLengthVector(vector, length) {
    const unitVect = getUnitVector({x: 0, y:0}, vector);
    return {
        x: unitVect.x * length,
        y: unitVect.y * length
    }
}

function getAngleBetweenVectors(vector1, vector2) {
    let cos = (vector1.x * vector2.x + vector1.y * vector2.y) / (getLengthVector(vector1) * getLengthVector(vector2));
    if(cos > 1) cos = 1;
    else if(cos < -1) cos = -1;
    return Math.acos(cos);
}

function getLengthVector(vector) {
    return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
}

function pointLeftToVector(vector, point) {
    return (vector.x*point.y-vector.y*point.x > 0 ? true : false); 
}

function rotateVector(vector, angle) {
    return {
        x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
        y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
    }
}

function isPointInsideCircle(point, center, radius) {
    return Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2) < Math.pow(radius, 2);
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function toDegrees (angle) {
    return angle * (180 / Math.PI);
}

canvas.addEventListener("click", e => {
    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);

    if(circleProp.isEdit) {
        if(circleProp.center == null) {
            circleProp.center = {
                x: cartesianPosition.x,
                y: cartesianPosition.y
            }
            hintLabelEl.innerHTML = "Нажмите ЛКМ, чтобы построить окружность";
        } else {
            circleProp.radius = getDistanceTwoPoints(circleProp.center, cartesianPosition);
            circleProp.isEdit = false;
            hintLabelEl.innerHTML = "Нажмите ЛКМ на место, в котором хотите построить источник лучей";
        }
        renderCanvas()
    } else if(rayProp.isEdit) {
        if(rayProp.start == null) {
            rayProp.start = {
                x: cartesianPosition.x,
                y: cartesianPosition.y
            }
            hintLabelEl.innerHTML = "Нажмите ЛКМ, чтобы построить луч";
        } else {
            rayProp.end = {
                x: cartesianPosition.x,
                y: cartesianPosition.y
            }
            rayProp.isEdit = false;

            insideInputEl.removeAttribute("disabled");
            insideRangeEl.removeAttribute("disabled");

            outsideInputEl.removeAttribute("disabled");
            outsideRangeEl.removeAttribute("disabled");

            manyRaysChkEl.removeAttribute("disabled");

            hintLabelEl.innerHTML = "Вы можете передвигать окружность";
        }
        renderCanvas()
    }
});

canvas.addEventListener("mousedown", e => {
    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    if(!circleProp.isEdit && getDistanceTwoPoints(cartesianPosition, circleProp.center) < 10) {
        circleProp.isMove = true;
    }


    if(!circleProp.isEdit && Math.abs(getDistanceTwoPoints(cartesianPosition, circleProp.center) - circleProp.radius) < 10) {
        circleProp.isChangeRadius = true;
    }
});


canvas.addEventListener("mouseup", e => {
    rayProp.movePoint = null;
    circleProp.isMove = false;
    circleProp.isChangeRadius = false;
});

canvas.addEventListener("contextmenu", e => {
    e.preventDefault();
});

canvas.addEventListener("mousemove", (e) => {
    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    
    cursorPos.x = cartesianPosition.x;
    cursorPos.y = cartesianPosition.y;
    

    if(circleProp.isMove) {
        canvas.style.cursor = "pointer";

        circleProp.center.x = cartesianPosition.x
        circleProp.center.y = cartesianPosition.y

        renderCanvas()
    } else if(circleProp.isChangeRadius) {
        canvas.style.cursor = "pointer";
        const newRadius = getDistanceTwoPoints(cartesianPosition, circleProp.center);
        if(newRadius > 20) circleProp.radius = newRadius; 

        renderCanvas();
    } else if(rayProp.movePoint) {
        canvas.style.cursor = "pointer";

        rayProp.movePoint.x = cartesianPosition.x
        rayProp.movePoint.y = cartesianPosition.y

        renderCanvas()
    } else {
        const isSelected = !circleProp.isEdit && (getDistanceTwoPoints(cartesianPosition, circleProp.center) < 10 ||  Math.abs(getDistanceTwoPoints(cartesianPosition, circleProp.center) - circleProp.radius) < 10);
        if(isSelected){
            canvas.style.cursor = "pointer"
        } else {
            canvas.style.cursor = "crosshair"
        }

        if((circleProp.isEdit && circleProp.center) || (rayProp.isEdit && rayProp.start)) {
            renderCanvas()
        } 
    }
});

removeBtnEl.addEventListener('click', () => {
    location.reload();
});

outsideRangeEl.addEventListener('input', (e) => {
    outsideInputEl.value = e.target.value;
    renderCanvas();
});

outsideInputEl.addEventListener('input', (e) => {
    outsideRangeEl.value = e.target.value
    renderCanvas();
})

insideRangeEl.addEventListener('input', (e) => {
    insideInputEl.value = e.target.value;
    renderCanvas();
});

insideInputEl.addEventListener('input', (e) => {
    insideRangeEl.value = e.target.value
    renderCanvas();
})


manyRaysChkEl.addEventListener('change', (e) => {
    renderCanvas();
})


renderCanvas();

