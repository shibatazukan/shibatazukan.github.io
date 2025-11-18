// 定数
const modelPath   = 'model/model.json';

/*****************モデル変更時更新*********************/
const classLabels 
= ['オナガガモ', 'カラス','カルガモ','カワセミ','キンクロハジロ','サギ', 'カワラバト', 'ハクチョウ', 'スズメ', 'メジロ', 'シジュウカラ', 'ツグミ'];
const labelInfo = {
  'オナガガモ': {
    name: 'オナガガモ',
    category: '鳥',
    description: 'しっぽがながいカモのなかまだよ！\n冬になると川や池でゆったりおよいでいるよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カラス': {
    name: 'カラス',
    category: '鳥',
    description: 'まっ黒で頭のいい鳥だよ！\n「カーカー」となく声がとくちょうなんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カルガモ': {
    name: 'カルガモ',
    category: '鳥',
    description: 'かわいい茶色のカモだよ！\nお母さんのあとをならんで歩く赤ちゃんが\nとってもかわいいんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カワセミ': {
    name: 'カワセミ',
    category: '鳥',
    description: '青くてとてもきれいな鳥だよ！\n川のそばにいて、水にとびこんで魚をつかまえるよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'キンクロハジロ': {
    name: 'キンクロハジロ',
    category: '鳥',
    description: '黒と白のきれいなカモのなかま！\nオスは金色の目がピカッとひかるよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'サギ': {
    name: 'サギ',
    category: '鳥',
    description: '白くて足の長い鳥だよ！\n川や田んぼで魚やカエルをとってたべるんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カワラバト': {
    name: 'カワラバト',
    category: '鳥',
    description: '公園などでよく見かけるハトだよ！\nもともとは人が飼っていたハトが野生になったんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'ハクチョウ': {
    name: 'ハクチョウ',
    category: '鳥',
    description: '大きくて白い、とてもきれいな水鳥だよ！\n冬になると、北の国から飛んできて池や湖で過ごすんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'スズメ': {
    name: 'スズメ',
    category: '鳥',
    description: '小さくて茶色い、街中で一番見かける鳥だよ！\n「チュンチュン」と元気になくよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'メジロ': {
    name: 'メジロ',
    category: '鳥',
    description: '目のまわりが白い、緑色の小さな鳥だよ！\n花のミツや果物が大好きなんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'シジュウカラ': {
    name: 'シジュウカラ',
    category: '鳥',
    description: '白と黒の体にくろいネクタイのようなもようがある鳥だよ！\n「ツツピー」「チュクチュク」と色々な声で話すのがとくちょうだよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'ツグミ': {
    name: 'ツグミ',
    category: '鳥',
    description: '茶色と白の体をした、冬になるとやってくる鳥だよ！\n地面でエサをさがすとき、ピョンピョンはねるのがかわいいね。',
    show3DObject: false,
    model: 'model/model.json'
  }
};
/****************************************************************************/

// DOM要素の取得
const video               = document.getElementById('webcam');
const drawingCanvas       = document.getElementById('drawingCanvas');
const ctx                 = drawingCanvas.getContext('2d');
const predictButton       = document.getElementById('predictButton');
const saveButton          = document.getElementById('saveButton');
const clearButton         = document.getElementById('clearButton');
const controlPanel        = document.getElementById('controlPanel');
const modeSelector        = document.getElementById('modeSelector');
const scene               = document.querySelector('a-scene');
const infoBubble          = document.getElementById('infoBubble');
const notificationMessage = document.getElementById('notificationMessage');
const progressIndicator   = document.getElementById('progressIndicator');
const progressText        = document.getElementById('progressText');
const progressFill        = document.querySelector('.progress-fill');
const startScreen         = document.getElementById('startScreen');
const startButton         = document.getElementById('startButton');

// グローバル変数
let model;
let isDrawing        = false;
let points           = [];
let identifiedObject = null;
let lastPrediction   = null;
let currentLocation  = null;
let detectionModel   = null;

// 矩形選択用の変数
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };
let currentSelection = null;
let isResizing = false;
let resizeHandle = null;
let initialSelection = null;
let initialMousePos = { x: 0, y: 0 };

// 現在のモードを取得
function getCurrentMode() {
  const selected = document.querySelector('input[name="selectionMode"]:checked');
  return selected ? selected.value : 'full';
}

// 緯度経度から住所を取得（localStorageにキャッシュ）
async function getAddressFromCoords(latitude, longitude) {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  const cache = JSON.parse(localStorage.getItem('addressCache') || '{}');
  if (cache[cacheKey]) {
    console.log('キャッシュから住所取得:', cacheKey);
    return cache[cacheKey];
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja&zoom=18`
    );
    
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [];
      
      const prefecture = addr.state || addr.prefecture || '';
      if (prefecture) parts.push(prefecture);
      
      const city = addr.city || addr.town || addr.village || '';
      if (city) parts.push(city);
      
      const district = addr.suburb || addr.quarter || addr.neighbourhood || '';
      if (district) parts.push(district);
      
      const houseNumber = addr.house_number || '';
      if (houseNumber) parts.push(houseNumber);
      
      if (parts.length > 0) {
        const address = parts.join('');
        cache[cacheKey] = address;
        localStorage.setItem('addressCache', JSON.stringify(cache));
        console.log('新規住所取得:', address);
        return address;
      }
    }
    
    cache[cacheKey] = '位置情報あり';
    localStorage.setItem('addressCache', JSON.stringify(cache));
    return '位置情報あり';
  } catch (error) {
    console.error('住所取得エラー:', error);
    return '位置情報あり';
  }
}

// A-Frameコンポーネント: 完全にカメラを向く
AFRAME.registerComponent('face-camera-full', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (camera) {
      const cameraPosition = new THREE.Vector3();
      camera.object3D.getWorldPosition(cameraPosition);
      
      const thisPosition = new THREE.Vector3();
      this.el.object3D.getWorldPosition(thisPosition);
      
      this.el.object3D.lookAt(cameraPosition);
      
      const euler = new THREE.Euler();
      euler.setFromQuaternion(this.el.object3D.quaternion);
      euler.z = 0;
      this.el.object3D.quaternion.setFromEuler(euler);
    }
  }
});

// A-Frameコンポーネント: 吹き出しのしっぽを更新
AFRAME.registerComponent('tail-update', {
  init: function () {
    this.tailBlack = this.el.querySelector('#tailBlack');
    this.tailWhite = this.el.querySelector('#tailWhite');
  },
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (!camera || !this.tailBlack || !this.tailWhite) return;

    const bubblePos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(bubblePos);
    
    const cameraPos = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraPos);

    const dy = cameraPos.y - bubblePos.y;
    
    if (dy > 0.5) {
      this.tailBlack.setAttribute('position', '0 0.575 0');
      this.tailWhite.setAttribute('position', '0 0.525 0');
    } else if (dy < -0.5) {
      this.tailBlack.setAttribute('position', '0 -0.575 0');
      this.tailWhite.setAttribute('position', '0 -0.525 0');
    } else {
      this.tailBlack.setAttribute('visible', false);
      this.tailWhite.setAttribute('visible', false);
      return;
    }
    
    this.tailBlack.setAttribute('visible', true);
    this.tailWhite.setAttribute('visible', true);
  }
});

/**
 * 最適化された境界計算
 */
function calculateOptimalBounds(points) {
  if (points.length < 2) {
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
  
  const FREEHAND_LINE_WIDTH = 6;
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

function showNotification(message, isError = false, isWarning = false) {
  notificationMessage.textContent = message;
  notificationMessage.className = '';
  if (isError) {
    notificationMessage.classList.add('error');
  } else if (isWarning) {
    notificationMessage.classList.add('warning');
  }
  notificationMessage.style.display = 'block';

  setTimeout(() => {
    notificationMessage.style.display = 'none';
  }, 3000);
}

function updateProgress(current, total) {
  progressText.textContent = `${current}/${total}`;
  const percentage = (current / total) * 100;
  progressFill.style.width = percentage + '%';
}

function showProgressIndicator(show = true) {
  progressIndicator.style.display = show ? 'block' : 'none';
}

function resizeCanvas() {
  drawingCanvas.width = video.offsetWidth;
  drawingCanvas.height = video.offsetHeight;
  
  if (getCurrentMode() === 'rectangle' && currentSelection) {
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
  }
}
window.addEventListener('resize', resizeCanvas);
video.addEventListener('loadedmetadata', resizeCanvas);

tf.loadLayersModel(modelPath).then(m => model = m).catch(err => {
  showNotification("モデルの読み込みに失敗しました。", true);
  console.error("Model load error:", err);
});

// 物体検出モデルを読み込み
(async function loadDetectionModel() {
  try {
    if (window.cocoSsd && typeof window.cocoSsd.load === 'function') {
      detectionModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.log('coco-ssd loaded');
    } else {
      console.warn('coco-ssd is not available');
    }
  } catch (e) {
    console.warn('Failed to load detection model', e);
  }
})();

// fullモードで自動的に対象領域を抽出
async function getAutoBoundsForFullMode() {
  if (!detectionModel) return null;
  try {
    const predictions = await detectionModel.detect(video);
    predictions.sort((a, b) => b.score - a.score);
    const minArea = (drawingCanvas.width * drawingCanvas.height) * 0.02;
    for (const p of predictions) {
      const [x, y, w, h] = p.bbox;
      const area = w * h;
      if (area < minArea) continue;
      const minX = Math.max(0, Math.floor(x));
      const minY = Math.max(0, Math.floor(y));
      const maxX = Math.min(drawingCanvas.width, Math.ceil(x + w));
      const maxY = Math.min(drawingCanvas.height, Math.ceil(y + h));
      const width = Math.max(0, maxX - minX);
      const height = Math.max(0, maxY - minY);
      if (width <= 0 || height <= 0) continue;
      return {
        minX, minY, maxX, maxY,
        width, height,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        area: width * height,
        aspectRatio: width / height
      };
    }
    return null;
  } catch (e) {
    console.warn('Detection failed', e);
    return null;
  }
}

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      },
      audio: false
    });
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
    });

    startScreen.style.display = 'none';
    await new Promise(resolve => setTimeout(resolve, 1500));

    controlPanel.style.display = 'flex';
    modeSelector.style.display = 'flex';
    
    const initialMode = getCurrentMode();
    if (initialMode === 'full') {
      drawingCanvas.style.pointerEvents = "none";
      predictButton.disabled = false;
      showNotification("カメラ準備完了。分類するボタンを押してください。");
    } else {
      drawingCanvas.style.pointerEvents = "auto";
      showNotification("カメラ準備完了。対象を選択してください。");
    }

    getLocation();

  } catch (err) {
    showNotification("カメラへのアクセスを許可してください。", true);
    startScreen.style.display = 'flex';
  }
}

startButton.addEventListener('click', () => {
  setupCamera();
});

function getLocation() {
  if (!navigator.geolocation) {
    console.log('位置情報がサポートされていません');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      };
      console.log('位置情報を取得しました:', currentLocation);
      showNotification('位置情報を取得しました', false, false);
    },
    (error) => {
      console.warn('位置情報の取得に失敗:', error.message);
      showNotification('位置情報の取得に失敗しました', false, true);
      currentLocation = null;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

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

// ★★★ Teachable Machine完全互換の推論処理 ★★★
predictButton.addEventListener('click', async () => {
  if (!model) {
    showNotification("モデルが読み込まれていません。", true);
    return;
  }

  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  // モードに応じて領域を決定
  let rawBounds = null;
  const mode = getCurrentMode();
  
  if (mode === 'full') {
    const detected = await getAutoBoundsForFullMode();
    if (detected) {
      rawBounds = detected;
    } else {
      const w = Math.floor(drawingCanvas.width * 0.8);
      const h = Math.floor(drawingCanvas.height * 0.8);
      const minX = Math.floor((drawingCanvas.width - w) / 2);
      const minY = Math.floor((drawingCanvas.height - h) / 2);
      rawBounds = {
        minX,
        minY,
        maxX: minX + w,
        maxY: minY + h,
        width: w,
        height: h,
        centerX: minX + w / 2,
        centerY: minY + h / 2,
        area: w * h,
        aspectRatio: w / h
      };
    }
  } else if (mode === 'rectangle') {
    if (!currentSelection) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("領域を選択してください。", true);
      return;
    }
    const width = currentSelection.maxX - currentSelection.minX;
    const height = currentSelection.maxY - currentSelection.minY;
    rawBounds = {
      minX: currentSelection.minX,
      minY: currentSelection.minY,
      maxX: currentSelection.maxX,
      maxY: currentSelection.maxY,
      width: width,
      height: height,
      centerX: (currentSelection.minX + currentSelection.maxX) / 2,
      centerY: (currentSelection.minY + currentSelection.maxY) / 2,
      area: width * height,
      aspectRatio: width / height
    };
  } else if (mode === 'freehand') {
    if (points.length < 2) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("囲いがありません。", true);
      return;
    }
    rawBounds = calculateOptimalBounds(points);
  }

  const bounds = normalizeAndValidateBounds(rawBounds);
  
  if (!bounds) {
    showProgressIndicator(false);
    predictButton.disabled = false;
    if (mode === 'full' && !detectionModel) {
      showNotification("モデル準備中です。数秒後にお試しください。", false, true);
    } else {
      showNotification("有効な領域を選択してください。", true);
    }
    return;
  }

  const { minX, minY, maxX, maxY, width, height } = bounds;

  //Teachable Machine互換推論処理
  const predictions = [];
  const totalSamples = 10;

  // 一時キャンバスを事前作成
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 224;
  tempCanvas.height = 224;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  for (let i = 0; i < totalSamples; i++) {
    updateProgress(i + 1, totalSamples);

    //リサイズ
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(video, minX, minY, width, height, 0, 0, 224, 224);

    // Teachable Machine標準の前処理（-1 to 1正規化）
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(tempCanvas, 3)
        .toFloat()
        .div(127.5)   // 0-255 → 0-2
        .sub(1.0)     // 0-2 → -1 to 1
        .expandDims(0);
    });

    const predictionArray = await model.predict(tensor).array();
    tensor.dispose();

    const scores = predictionArray[0];
    predictions.push([...scores]);

    // フレーム更新待機（ビデオフレームの変化を待つ）
    await new Promise(resolve => setTimeout(resolve, 80));
  }

  //信頼度重み付け平均による最終判定
  showProgressIndicator(false);

  // 各クラスの平均スコアを計算
  const numClasses = classLabels.length;
  const avgScores = new Array(numClasses).fill(0);
  
  for (let i = 0; i < numClasses; i++) {
    let sum = 0;
    for (let j = 0; j < predictions.length; j++) {
      sum += predictions[j][i];
    }
    avgScores[i] = sum / predictions.length;
  }

  // 最も高い平均スコアを持つクラスを選択
  const maxAvgScore = Math.max(...avgScores);
  const finalIndex = avgScores.indexOf(maxAvgScore);
  const finalLabel = classLabels[finalIndex];
  const confidence = maxAvgScore;

  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }

  const bubbleText = document.getElementById('bubbleText');

  // 信頼度チェック（閾値: 0.5）
  if (confidence >= 0.98) {
    const labelData = labelInfo[finalLabel];
    const confidencePercent = (confidence * 100).toFixed(1);
    const template = `なまえ：${labelData.name}\n種類　：${labelData.category}\n説明　：${labelData.description}\n\n信頼度：${confidencePercent}%`;

    await new Promise(resolve => setTimeout(resolve, 100));

    const camera = document.querySelector('#mainCamera');
    const bubble = document.getElementById('infoBubble');
    const bubbleTextEl = document.getElementById('bubbleText');

    if (!camera || !camera.object3D) {
      predictButton.disabled = false;
      return;
    }

    bubbleTextEl.setAttribute('value', template);

    const cameraWorldPosition = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraWorldPosition);

    const infoBubblePosition = new THREE.Vector3(0, 0, -2);
    infoBubblePosition.applyQuaternion(camera.object3D.quaternion);
    infoBubblePosition.add(cameraWorldPosition);

    bubble.setAttribute('position', infoBubblePosition);
    bubble.setAttribute('visible', true);

    lastPrediction = {
      label: finalLabel,
      confidence: confidence,
      avgScores: avgScores
    };
    saveButton.disabled = false;

  } else {
    const camera = document.querySelector('#mainCamera');
    if (!camera || !camera.object3D) {
      predictButton.disabled = false;
      return;
    }

    infoBubble.setAttribute('visible', true);
    bubbleText.setAttribute('value', `分類できませんでした。\n別の角度から試してください。\n\n最高信頼度: ${(confidence * 100).toFixed(1)}%`);
    const cameraWorldPosition = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraWorldPosition);
    const infoBubblePosition = new THREE.Vector3(0, 0, -2);
    infoBubblePosition.applyQuaternion(camera.object3D.quaternion);
    infoBubblePosition.add(cameraWorldPosition);
    infoBubble.setAttribute('position', infoBubblePosition);

    saveButton.disabled = true;
  }

  const currentMode = getCurrentMode();
  if (currentMode === 'freehand') {
    points = [];
  } else if (currentMode === 'rectangle') {
    currentSelection = null;
  }
  clearCanvas();
  predictButton.disabled = false;
});

saveButton.addEventListener('click', async () => {
  if (!lastPrediction) return;

  saveButton.disabled = true;
  showNotification('登録中...', false, false);

  const { label, confidence, avgScores } = lastPrediction; // avgScoresも取得
  const now = new Date().toISOString();
  const labelData = labelInfo[label];
  
  let locationData = null;
  if (currentLocation) {
    const address = await getAddressFromCoords(
      currentLocation.latitude,
      currentLocation.longitude
    );
    
    locationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      timestamp: currentLocation.timestamp,
      address: address
    };
  }
  
  // ★★★ 一致枚数を計算 ★★★
  const totalSamples = 10; // 推論時のサンプル数
  const classIndex = classLabels.indexOf(label);
  let matchCount = 0;
  
  // lastPredictionに保存されている全予測結果から、
  // このクラスが最高スコアだった回数をカウント
  // ※ただし、avgScoresしか保存していない場合は概算値を使用
  // より正確にするには、predictButtonの処理で全予測を保存する
  matchCount = Math.round(confidence * totalSamples); // 簡易的な計算
  
  const entry = {
    name: labelData.name,
    category: labelData.category,
    description: labelData.description,
    date: now,
    confidence: confidence,
    matchCount: matchCount,        // ★追加
    totalSamples: totalSamples,    // ★追加
    location: locationData
  };

  let zukan = JSON.parse(localStorage.getItem('myZukan') || '[]');

  const exists = zukan.some(item => item.name === entry.name);

  if (!exists) {
    zukan.push(entry);
    localStorage.setItem('myZukan', JSON.stringify(zukan));
    const locationMsg = locationData ? `（${locationData.address}）` : '';
    showNotification('「' + labelData.name + '」をマイずかんに登録しました！' + locationMsg);
  } else {
    showNotification('「' + labelData.name + '」はすでに登録済みです。', true);
  }

  lastPrediction = null;
});
