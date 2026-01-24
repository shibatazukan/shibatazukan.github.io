// camera.drawing.js
// 描画・選択関連ロジック

// フリーハンド描画用の定数
const FREEHAND_LINE_WIDTH = 6;
const FREEHAND_STROKE_COLOR = '#000000';

ctx.strokeStyle = FREEHAND_STROKE_COLOR;
ctx.lineWidth = FREEHAND_LINE_WIDTH;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// 矩形選択の描画（リサイズ可能な枠）
function drawResizableRectangle(selection) {
  if (!selection) return;
  
  const { minX, minY, maxX, maxY } = selection;
  const width = maxX - minX;
  const height = maxY - minY;
  const handleSize = 12;
  
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(minX, minY, width, height);
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#007bff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  
  const handles = [
    { x: minX, y: minY, type: 'nw' },
    { x: maxX, y: minY, type: 'ne' },
    { x: minX, y: maxY, type: 'sw' },
    { x: maxX, y: maxY, type: 'se' }
  ];
  
  handles.forEach(handle => {
    ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
  });
}

// どのハンドル（または枠本体）がクリックされたかを判定
function getResizeHandle(mouseX, mouseY, selection) {
  if (!selection) return null;
  
  const { minX, minY, maxX, maxY } = selection;
  const handleSize = 12;
  const tolerance = handleSize / 2 + 5;
  
  if (Math.abs(mouseX - minX) < tolerance && Math.abs(mouseY - minY) < tolerance) return 'nw';
  if (Math.abs(mouseX - maxX) < tolerance && Math.abs(mouseY - minY) < tolerance) return 'ne';
  if (Math.abs(mouseX - minX) < tolerance && Math.abs(mouseY - maxY) < tolerance) return 'sw';
  if (Math.abs(mouseX - maxX) < tolerance && Math.abs(mouseY - maxY) < tolerance) return 'se';
  
  if (Math.abs(mouseY - minY) < tolerance && mouseX >= minX && mouseX <= maxX) return 'n';
  if (Math.abs(mouseY - maxY) < tolerance && mouseX >= minX && mouseX <= maxX) return 's';
  if (Math.abs(mouseX - minX) < tolerance && mouseY >= minY && mouseY <= maxY) return 'w';
  if (Math.abs(mouseX - maxX) < tolerance && mouseY >= minY && mouseY <= maxY) return 'e';
  
  if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) return 'move';
  
  return null;
}

// フリーハンド描画
function drawFreehand(points) {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  if (points.length < 2) return;
  
  ctx.strokeStyle = FREEHAND_STROKE_COLOR;
  ctx.lineWidth = FREEHAND_LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

/**
 * 最適化された境界計算（フリーハンドの点列から領域を推定）
 */
function calculateOptimalBounds(points) {
  if (!points || points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  const xValues = points.map(p => p.x).sort((a, b) => a - b);
  const yValues = points.map(p => p.y).sort((a, b) => a - b);

  const xQ1 = xValues[Math.floor(xValues.length * 0.25)];
  const xQ3 = xValues[Math.floor(xValues.length * 0.75)];
  const yQ1 = yValues[Math.floor(yValues.length * 0.25)];
  const yQ3 = yValues[Math.floor(yValues.length * 0.75)];

  const xIQR = xQ3 - xQ1;
  const yIQR = yQ3 - yQ1;
  const outlierMultiplier = (xIQR < 10 || yIQR < 10) ? 1.0 : 1.5;

  const xLowerBound = xQ1 - outlierMultiplier * xIQR;
  const xUpperBound = xQ3 + outlierMultiplier * xIQR;
  const yLowerBound = yQ1 - outlierMultiplier * yIQR;
  const yUpperBound = yQ3 + outlierMultiplier * yIQR;

  const filteredPoints = points.filter(p =>
    p.x >= xLowerBound && p.x <= xUpperBound &&
    p.y >= yLowerBound && p.y <= yUpperBound
  );

  const validPoints = filteredPoints.length >= Math.max(2, points.length * 0.5) ? filteredPoints : points;

  let minX = Math.min(...validPoints.map(p => p.x));
  let minY = Math.min(...validPoints.map(p => p.y));
  let maxX = Math.max(...validPoints.map(p => p.x));
  let maxY = Math.max(...validPoints.map(p => p.y));

  const lineRadius = FREEHAND_LINE_WIDTH / 2;
  minX -= lineRadius;
  minY -= lineRadius;
  maxX += lineRadius;
  maxY += lineRadius;

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const area = rawWidth * rawHeight;

  let paddingRatio;
  if (area < 1000) {
    paddingRatio = 0.15;
  } else if (area < 10000) {
    paddingRatio = 0.12;
  } else {
    paddingRatio = 0.08;
  }

  const minPadding = Math.max(5, lineRadius);
  const maxPadding = Math.min(drawingCanvas.width * 0.1, drawingCanvas.height * 0.1, 20);

  const paddingX = Math.max(minPadding, Math.min(maxPadding, rawWidth * paddingRatio));
  const paddingY = Math.max(minPadding, Math.min(maxPadding, rawHeight * paddingRatio));

  minX -= paddingX;
  minY -= paddingY;
  maxX += paddingX;
  maxY += paddingY;

  minX = Math.max(0, Math.floor(minX));
  minY = Math.max(0, Math.floor(minY));
  maxX = Math.min(drawingCanvas.width, Math.ceil(maxX));
  maxY = Math.min(drawingCanvas.height, Math.ceil(maxY));

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY,
    area: width * height,
    aspectRatio: width / height
  };
}

/**
 * 領域を正規化・検証する関数
 */
function normalizeAndValidateBounds(bounds) {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const { minX, minY, maxX, maxY, width, height } = bounds;

  const MIN_WIDTH = 50;
  const MIN_HEIGHT = 50;
  const MIN_AREA = 2500;

  if (width < MIN_WIDTH || height < MIN_HEIGHT || width * height < MIN_AREA) {
    return null;
  }

  if (minX < 0 || minY < 0 || maxX > drawingCanvas.width || maxY > drawingCanvas.height) {
    const adjustedMinX = Math.max(0, Math.floor(minX));
    const adjustedMinY = Math.max(0, Math.floor(minY));
    const adjustedMaxX = Math.min(drawingCanvas.width, Math.ceil(maxX));
    const adjustedMaxY = Math.min(drawingCanvas.height, Math.ceil(maxY));

    const adjustedWidth = adjustedMaxX - adjustedMinX;
    const adjustedHeight = adjustedMaxY - adjustedMinY;

    if (adjustedWidth < MIN_WIDTH || adjustedHeight < MIN_HEIGHT || adjustedWidth * adjustedHeight < MIN_AREA) {
      return null;
    }

    return {
      minX: adjustedMinX,
      minY: adjustedMinY,
      maxX: adjustedMaxX,
      maxY: adjustedMaxY,
      width: adjustedWidth,
      height: adjustedHeight,
      centerX: (adjustedMinX + adjustedMaxX) / 2,
      centerY: (adjustedMinY + adjustedMaxY) / 2,
      area: adjustedWidth * adjustedHeight,
      aspectRatio: adjustedWidth / adjustedHeight
    };
  }

  return {
    minX: Math.floor(minX),
    minY: Math.floor(minY),
    maxX: Math.ceil(maxX),
    maxY: Math.ceil(maxY),
    width: Math.ceil(width),
    height: Math.ceil(height),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    area: width * height,
    aspectRatio: width / height
  };
}

// マウス/タッチイベントハンドラ
function getCanvasCoordinates(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

function handleCanvasStart(e) {
  const mode = getCurrentMode();
  if (mode === 'freehand') {
    handleFreehandStart(e);
  } else if (mode === 'rectangle') {
    handleRectangleStart(e);
  }
}

function handleCanvasMove(e) {
  const mode = getCurrentMode();
  if (mode === 'freehand') {
    handleFreehandMove(e);
  } else if (mode === 'rectangle') {
    handleRectangleMove(e);
  }
}

function handleCanvasEnd(e) {
  const mode = getCurrentMode();
  if (mode === 'freehand') {
    handleFreehandEnd(e);
  } else if (mode === 'rectangle') {
    handleRectangleEnd(e);
  }
}

function setupEventListeners() {
  drawingCanvas.style.pointerEvents = "auto";
  
  drawingCanvas.addEventListener('mousedown', handleCanvasStart);
  drawingCanvas.addEventListener('mousemove', handleCanvasMove);
  drawingCanvas.addEventListener('mouseup', handleCanvasEnd);
  drawingCanvas.addEventListener('mouseleave', handleCanvasEnd);
  
  drawingCanvas.addEventListener('touchstart', handleCanvasStart);
  drawingCanvas.addEventListener('touchmove', handleCanvasMove);
  drawingCanvas.addEventListener('touchend', handleCanvasEnd);
}

function handleFreehandStart(e) {
  if (getCurrentMode() !== 'freehand') return;
  e.preventDefault();
  isDrawing = true;
  const coords = getCanvasCoordinates(e);
  points = [coords];
  ctx.strokeStyle = FREEHAND_STROKE_COLOR;
  ctx.lineWidth = FREEHAND_LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
}

function handleFreehandMove(e) {
  if (!isDrawing || getCurrentMode() !== 'freehand') return;
  e.preventDefault();
  const coords = getCanvasCoordinates(e);
  points.push(coords);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
  predictButton.disabled = false;
}

function handleFreehandEnd(e) {
  if (getCurrentMode() !== 'freehand') return;
  e.preventDefault();
  isDrawing = false;
  ctx.closePath();
}

function resizeSelection(handle, initialSel, initialMouse, currentMouse) {
  const dx = currentMouse.x - initialMouse.x;
  const dy = currentMouse.y - initialMouse.y;
  
  let { minX, minY, maxX, maxY } = { ...initialSel };
  
  switch (handle) {
    case 'nw':
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 'ne':
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 'sw':
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'se':
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'n':
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 's':
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'w':
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      break;
    case 'e':
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      break;
    case 'move':
      const width = initialSel.maxX - initialSel.minX;
      const height = initialSel.maxY - initialSel.minY;
      minX = Math.max(0, Math.min(initialSel.minX + dx, drawingCanvas.width - width));
      minY = Math.max(0, Math.min(initialSel.minY + dy, drawingCanvas.height - height));
      maxX = minX + width;
      maxY = minY + height;
      break;
  }
  
  return { minX, minY, maxX, maxY };
}

function handleRectangleStart(e) {
  if (getCurrentMode() !== 'rectangle') return;
  e.preventDefault();
  
  const coords = getCanvasCoordinates(e);
  
  if (!currentSelection) {
    const defaultSize = Math.min(drawingCanvas.width, drawingCanvas.height) * 0.6;
    const centerX = drawingCanvas.width / 2;
    const centerY = drawingCanvas.height / 2;
    currentSelection = {
      minX: centerX - defaultSize / 2,
      minY: centerY - defaultSize / 2,
      maxX: centerX + defaultSize / 2,
      maxY: centerY + defaultSize / 2
    };
    predictButton.disabled = false;
    drawResizableRectangle(currentSelection);
    return;
  }
  
  resizeHandle = getResizeHandle(coords.x, coords.y, currentSelection);
  
  if (resizeHandle) {
    isResizing = true;
    initialSelection = { ...currentSelection };
    initialMousePos = { x: coords.x, y: coords.y };
    
    const cursorMap = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize',
      'move': 'move'
    };
    drawingCanvas.style.cursor = cursorMap[resizeHandle] || 'default';
  }
}

function handleRectangleMove(e) {
  if (getCurrentMode() !== 'rectangle') return;
  
  const coords = getCanvasCoordinates(e);
  
  if (isResizing && resizeHandle && initialSelection) {
    e.preventDefault();
    currentSelection = resizeSelection(resizeHandle, initialSelection, initialMousePos, coords);
    clearCanvas();
    drawResizableRectangle(currentSelection);
    return;
  }
  
  if (currentSelection) {
    const handle = getResizeHandle(coords.x, coords.y, currentSelection);
    const cursorMap = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize',
      'move': 'move'
    };
    drawingCanvas.style.cursor = handle ? (cursorMap[handle] || 'default') : 'default';
  }
}

function handleRectangleEnd(e) {
  if (getCurrentMode() !== 'rectangle') return;
  
  if (isResizing) {
    e.preventDefault();
    isResizing = false;
    resizeHandle = null;
    initialSelection = null;
    initialMousePos = { x: 0, y: 0 };
    drawingCanvas.style.cursor = 'default';
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// ラジオボタン変更時の挙動と初期化

document.querySelectorAll('input[name="selectionMode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    clearCanvas();
    points = [];
    currentSelection = null;
    isDrawing = false;
    isSelecting = false;
    isResizing = false;
    resizeHandle = null;
    initialSelection = null;
    initialMousePos = { x: 0, y: 0 };
    drawingCanvas.style.cursor = 'default';
    
    const mode = getCurrentMode();
    if (mode === 'full') {
      drawingCanvas.style.pointerEvents = "none";
      predictButton.disabled = false;
    } else if (mode === 'rectangle') {
      drawingCanvas.style.pointerEvents = "auto";
      const defaultSize = Math.min(drawingCanvas.width, drawingCanvas.height) * 0.6;
      const centerX = drawingCanvas.width / 2;
      const centerY = drawingCanvas.height / 2;
      currentSelection = {
        minX: centerX - defaultSize / 2,
        minY: centerY - defaultSize / 2,
        maxX: centerX + defaultSize / 2,
        maxY: centerY + defaultSize / 2
      };
      drawResizableRectangle(currentSelection);
      predictButton.disabled = false;
    } else {
      drawingCanvas.style.pointerEvents = "auto";
      predictButton.disabled = true;
    }
  });
});

setupEventListeners();

clearButton.addEventListener('click', () => {
  isArActive = false;
  clearCanvas();
  points = [];
  currentSelection = null;
  isDrawing = false;
  isSelecting = false;
  isResizing = false;
  resizeHandle = null;
  initialSelection = null;
  initialMousePos = { x: 0, y: 0 };
  drawingCanvas.style.cursor = 'default';
  
  const mode = getCurrentMode();
  if (mode === 'rectangle') {
    const defaultSize = Math.min(drawingCanvas.width, drawingCanvas.height) * 0.6;
    const centerX = drawingCanvas.width / 2;
    const centerY = drawingCanvas.height / 2;
    currentSelection = {
      minX: centerX - defaultSize / 2,
      minY: centerY - defaultSize / 2,
      maxX: centerX + defaultSize / 2,
      maxY: centerY + defaultSize / 2
    };
    drawResizableRectangle(currentSelection);
    predictButton.disabled = false;
  } else if (mode === 'full') {
    predictButton.disabled = false;
  } else {
    predictButton.disabled = true;
  }
  
  saveButton.disabled = true;
  infoBubble.setAttribute('visible', false);
  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }
  lastPrediction = null;
  showProgressIndicator(false);
});