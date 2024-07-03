const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const polygon = new Path2D();

const removeBtnEl = document.getElementById("remove-btn");
const angleVertRangeEl = document.getElementById("angle-vertical-range");
const angleVertInputEl = document.getElementById("angle-vertical-input");
const angleHorRangeEl = document.getElementById("angle-horizontal-range");
const angleHorInputEl = document.getElementById("angle-horizontal-input");
const colorStrokeInputEl = document.getElementById("color-stroke-input");
const colorFillInputEl = document.getElementById("color-fill-input");
const hintLabelEl = document.getElementById("hint-label");

let pointsArr = [];

let isEditMode = true;

canvas.width = 800;
canvas.height = 400;

function drawGrid() {
    const cellSize = 40;
    ctx.strokeStyle = "#cecece";
    for (var x = -0.5; x < canvas.width; x += cellSize) ctx.strokeRect(x, 0, 0.1, canvas.height);
    for (var y = -0.5; y < canvas.height; y += cellSize) ctx.strokeRect(0, y, canvas.width, 0.1);

    const axisSize = 2;
    ctx.fillStyle = "#000";
    ctx.fillRect((canvas.width - axisSize) / 2, 0, axisSize, canvas.height);
    ctx.fillRect(0, (canvas.height - axisSize) / 2, canvas.width, axisSize);
}

function drawPolygon() {
    ctx.beginPath();
    ctx.strokeStyle = colorStrokeInputEl.value;
    pointsArr.forEach((item, index) => {
        const absolutePos = getAbsolutePosition(item.x, item.y);
        if (index == 0) {
            ctx.moveTo(absolutePos.x, absolutePos.y);
            if (isEditMode) {
                var circle = new Path2D();
                circle.arc(absolutePos.x, absolutePos.y, 10, 0, 2 * Math.PI);
                ctx.stroke(circle);
            }
        } else {
            ctx.lineTo(absolutePos.x, absolutePos.y);
        }
        var circle = new Path2D();
        circle.arc(absolutePos.x, absolutePos.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = colorStrokeInputEl.value;
        ctx.fill(circle);
    });
    // isClosePath && ctx.closePath();
    if (!isEditMode) {
        ctx.fillStyle = colorFillInputEl.value + "50";
        ctx.fill();
    }
    ctx.stroke();
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPolygon();
}

function addPointsInPolygons() {
    const copyArr = JSON.parse(JSON.stringify(pointsArr));
    let countAddedPoints = 0;

    for (let index = 0; index < copyArr.length; index++) {
        const currItem = copyArr[index];
        const nextItem = index != copyArr.length - 1 ? copyArr[index + 1] : copyArr[0];
        const distance = getDistanceTwoPoints(
            { x: currItem.oldX, y: currItem.oldY },
            { x: nextItem.oldX, y: nextItem.oldY }
        );
        const countNewPoints = Math.floor(distance / 10);
        if (countNewPoints > 0) {
            const range = distance / countNewPoints;
            for (let i = 1; i <= countNewPoints; i++) {
                const position = {
                    x: currItem.x + ((nextItem.x - currItem.x) / distance) * (i * range),
                    y: currItem.y + ((nextItem.y - currItem.y) / distance) * (i * range),
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

function polygonBending(angleVert, angleHor) {
    // const maxHeight = pointsArr.reduce((res, item) => {
    //     const height = Math.abs(item.oldY);
    //     if(height > res) return height;
    //     return res;
    // }, 0);
    pointsArr.forEach((item) => {
        // const radians = toRadians(-angle) * item.oldY / maxHeight;
        const radiansVert = (toRadians(-angleVert) * item.oldY) / 40;
        const radiansHor = (toRadians(-angleHor) * item.oldX) / 40;
        item.x = item.oldX * Math.cos(radiansVert + radiansHor) - item.oldY * Math.sin(radiansVert + radiansHor);
        item.y = item.oldX * Math.sin(radiansVert + radiansHor) + item.oldY * Math.cos(radiansVert + radiansHor);
    });
}

function getDistanceTwoPoints(pointOne, pointTwo) {
    return Math.sqrt(Math.pow(pointOne.x - pointTwo.x, 2) + Math.pow(pointOne.y - pointTwo.y, 2));
}

var getAbsolutePosition = function (x, y) {
    var midWidth = canvas.width / 2;
    var midHeight = canvas.height / 2;
    var cartesianX = midWidth + x;
    var cartesianY = midHeight - y;

    return { x: cartesianX, y: cartesianY };
};

var getCartesianPosition = function (x, y) {
    var midWidth = canvas.width / 2;
    var midHeight = canvas.height / 2;
    var absoluteX = x - midWidth;
    var absoluteY = midHeight - y;

    return { x: absoluteX, y: absoluteY };
};

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

canvas.addEventListener("click", (e) => {
    if (!isEditMode) return;

    const cartesianPosition = getCartesianPosition(e.offsetX, e.offsetY);
    if (pointsArr.length > 2 && getDistanceTwoPoints(cartesianPosition, pointsArr[0]) < 10) {
        isEditMode = false;
        hintLabelEl.innerHTML = "Измените значение угла изгиба, чтобы деформировать полигон";
        angleVertRangeEl.removeAttribute("disabled");
        angleVertInputEl.removeAttribute("disabled");
        angleHorRangeEl.removeAttribute("disabled");
        angleHorInputEl.removeAttribute("disabled");
        addPointsInPolygons();
        renderCanvas();
    } else {
        pointsArr.push({
            x: cartesianPosition.x,
            y: cartesianPosition.y,
            oldX: cartesianPosition.x,
            oldY: cartesianPosition.y,
        });
        renderCanvas();
    }
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

canvas.addEventListener("mousemove", (e) => {
    if (
        pointsArr.length > 2 &&
        isEditMode &&
        getDistanceTwoPoints(getCartesianPosition(e.offsetX, e.offsetY), pointsArr[0]) < 10
    ) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "crosshair";
    }
});

removeBtnEl.addEventListener("click", () => {
    pointsArr = [];
    isEditMode = true;
    hintLabelEl.innerHTML = "Нарисуйте полигон используя мышку";
    angleVertRangeEl.value = 0;
    angleVertInputEl.value = 0;
    angleVertRangeEl.setAttribute("disabled", true);
    angleVertInputEl.setAttribute("disabled", true);
    angleHorRangeEl.value = 0;
    angleHorInputEl.value = 0;
    angleHorRangeEl.setAttribute("disabled", true);
    angleHorInputEl.setAttribute("disabled", true);
    renderCanvas();
});

angleVertRangeEl.addEventListener("input", (e) => {
    angleVertInputEl.value = e.target.value;
    polygonBending(e.target.value, angleHorInputEl.value);
    renderCanvas();
});

angleVertInputEl.addEventListener("input", (e) => {
    angleVertRangeEl.value = e.target.value;
    polygonBending(e.target.value, angleHorInputEl.value);
    renderCanvas();
});

angleHorRangeEl.addEventListener("input", (e) => {
    angleHorInputEl.value = e.target.value;
    polygonBending(angleVertInputEl.value, e.target.value);
    renderCanvas();
});

angleHorInputEl.addEventListener("input", (e) => {
    angleHorRangeEl.value = e.target.value;
    polygonBending(angleVertInputEl.value, e.target.value);
    renderCanvas();
});

colorStrokeInputEl.addEventListener("input", (e) => {
    renderCanvas();
});

colorFillInputEl.addEventListener("input", (e) => {
    renderCanvas();
});

renderCanvas();
