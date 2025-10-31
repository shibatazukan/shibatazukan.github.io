// 定数
const modelPath   = 'model/model.json';
const classLabels = ['あやめ', 'さくら', '赤とんぼ', 'カブトムシ', 'クワガタ'];
const labelInfo   = {
  'あやめ': {
    name: 'あやめ',
    category: '草花',
    description: 'きれいなむらさき色の花だよ！\n春になると咲いて、\n水の近くで見つけられるよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'さくら': {
    name: 'さくら',
    category: '木の花',
    description: 'ピンク色のとってもきれいな花だよ！\n春の一番人気の花で、\nお花見でみんなが見に来るよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  '赤とんぼ': {
    name: '赤とんぼ',
    category: '昆虫',
    description: '赤い色のとんぼだよ！\n大きな羽で空をとんで、\nとってもはやく飛べるんだ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カブトムシ': {
    name: 'カブトムシ',
    category: '昆虫',
    description: '黒くてかっこいい虫だよ！\n頭に大きな角があって、\n夏になると元気に活動するよ。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'クワガタ': {
    name: 'クワガタ',
    category: '昆虫',
    description: '大きなあごがとくちょうの虫だよ！\nはさみみたいなあごで、\n夏になるとたくさん見つかるよ。',
    show3DObject: false,
    model: 'model/model.json'
  }
};

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
let detectionModel   = null; // coco-ssd 物体検出モデル

// 矩形選択用の変数
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };
let currentSelection = null; // { minX, minY, maxX, maxY }
let isResizing = false;
let resizeHandle = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w', 'move', null
let initialSelection = null; // リサイズ開始時の選択範囲
let initialMousePos = { x: 0, y: 0 }; // リサイズ開始時のマウス位置

// 現在のモードを取得
function getCurrentMode() {
  const selected = document.querySelector('input[name="selectionMode"]:checked');
  return selected ? selected.value : 'full';
}

// ImageNet標準化用の定数
const IMAGENET_MEAN = tf.tensor1d([123.68, 116.779, 103.939]);
const IMAGENET_STD  = tf.tensor1d([58.393, 57.12, 57.375]);

// 緯度経度から住所を取得（localStorageにキャッシュ）
async function getAddressFromCoords(latitude, longitude) {
  // 座標をキーとして使用
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  // localStorageのキャッシュを確認
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
      
      // 都道府県
      const prefecture = addr.state || addr.prefecture || '';
      if (prefecture) parts.push(prefecture);
      
      // 市区町村
      const city = addr.city || addr.town || addr.village || '';
      if (city) parts.push(city);
      
      // 町名・地区名
      const district = addr.suburb || addr.quarter || addr.neighbourhood || '';
      if (district) parts.push(district);
      
      // 番地・house_number（丁目や番地の情報）
      const houseNumber = addr.house_number || '';
      if (houseNumber) parts.push(houseNumber);
      
      if (parts.length > 0) {
        const address = parts.join('');
        // localStorageに保存
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

function applyImageEnhancement(ctx, canvas, options = {}) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  if (options.noiseReduction) {
    applyGaussianBlur(data, canvas.width, canvas.height, 1);
  }
  
  if (options.contrast !== 1.0) {
    applyContrastAdjustment(data, options.contrast);
  }
  
  if (options.sharpness !== 1.0) {
    applySharpnessAdjustment(data, canvas.width, canvas.height, options.sharpness);
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyGaussianBlur(data, width, height, radius) {
  const temp = new Uint8ClampedArray(data);
  const sigma = radius / 3;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let weight = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const w = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
          r += temp[idx] * w;
          g += temp[idx + 1] * w;
          b += temp[idx + 2] * w;
          a += temp[idx + 3] * w;
          weight += w;
        }
      }
      
      const idx = (y * width + x) * 4;
      data[idx] = r / weight;
      data[idx + 1] = g / weight;
      data[idx + 2] = b / weight;
      data[idx + 3] = a / weight;
    }
  }
}

function applyContrastAdjustment(data, contrast) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
}

function applySharpnessAdjustment(data, width, height, sharpness) {
  const temp = new Uint8ClampedArray(data);
  const kernel = [
    0, -sharpness, 0,
    -sharpness, 1 + 4 * sharpness, -sharpness,
    0, -sharpness, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const idx = ((y + ky - 1) * width + (x + kx - 1)) * 4;
          const weight = kernel[ky * 3 + kx];
          r += temp[idx] * weight;
          g += temp[idx + 1] * weight;
          b += temp[idx + 2] * weight;
        }
      }
      
      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = Math.max(0, Math.min(255, b));
    }
  }
}

function calculateConfidenceVariance(scores) {
  if (scores.length < 2) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  return Math.sqrt(variance);
}

/**
 * 最適化された境界計算（洗練版）
 * 外れ値除去、適切なパディング、境界チェックを統合
 * 線の太さを考慮した計算に改善
 */
function calculateOptimalBounds(points) {
  if (points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  
  // 統計的に外れ値を除去
  const xValues = points.map(p => p.x).sort((a, b) => a - b);
  const yValues = points.map(p => p.y).sort((a, b) => a - b);
  
  const xQ1 = xValues[Math.floor(xValues.length * 0.25)];
  const xQ3 = xValues[Math.floor(xValues.length * 0.75)];
  const yQ1 = yValues[Math.floor(yValues.length * 0.25)];
  const yQ3 = yValues[Math.floor(yValues.length * 0.75)];
  
  const xIQR = xQ3 - xQ1;
  const yIQR = yQ3 - yQ1;
  
  // IQRが小さい場合（点が密集している場合）は、より厳格な外れ値除去を使用
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
  
  // 基本境界を計算
  let minX = Math.min(...validPoints.map(p => p.x));
  let minY = Math.min(...validPoints.map(p => p.y));
  let maxX = Math.max(...validPoints.map(p => p.x));
  let maxY = Math.max(...validPoints.map(p => p.y));
  
  // 線の太さを考慮した補正
  // 線の太さが8ピクセルなので、実際の描画範囲は線の中心から半径4ピクセル（線幅/2）広がる
  const lineRadius = FREEHAND_LINE_WIDTH / 2; // 4ピクセル
  minX -= lineRadius;
  minY -= lineRadius;
  maxX += lineRadius;
  maxY += lineRadius;
  
  // パディング計算（領域サイズに応じて適応的）
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const area = rawWidth * rawHeight;
  
  // パディング: 小さい領域ほど大きなパディング、大きい領域ほど小さなパディング
  // 線が太くなった分、パディングを少し調整
  let paddingRatio;
  if (area < 1000) {
    paddingRatio = 0.15; // 小さな領域: 15%
  } else if (area < 10000) {
    paddingRatio = 0.12; // 中程度の領域: 12%
  } else {
    paddingRatio = 0.08; // 大きな領域: 8%
  }
  
  // 最小パディング（ピクセル単位）
  // 線が太くなったので、最小パディングも少し増やす
  const minPadding = Math.max(5, lineRadius); // 線の半径と最小パディングの大きい方
  const maxPadding = Math.min(drawingCanvas.width * 0.1, drawingCanvas.height * 0.1, 20);
  
  const paddingX = Math.max(minPadding, Math.min(maxPadding, rawWidth * paddingRatio));
  const paddingY = Math.max(minPadding, Math.min(maxPadding, rawHeight * paddingRatio));
  
  // パディングを適用
  minX -= paddingX;
  minY -= paddingY;
  maxX += paddingX;
  maxY += paddingY;
  
  // 境界チェックと調整
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
  
  // 最小サイズチェック（224x224は一般的なモデル入力サイズ）
  const MIN_WIDTH = 50;
  const MIN_HEIGHT = 50;
  const MIN_AREA = 2500; // 50x50
  
  if (width < MIN_WIDTH || height < MIN_HEIGHT || width * height < MIN_AREA) {
    return null;
  }
  
  // 境界がキャンバス内に収まっているか確認
  if (minX < 0 || minY < 0 || maxX > drawingCanvas.width || maxY > drawingCanvas.height) {
    // 境界を調整
    const adjustedMinX = Math.max(0, Math.floor(minX));
    const adjustedMinY = Math.max(0, Math.floor(minY));
    const adjustedMaxX = Math.min(drawingCanvas.width, Math.ceil(maxX));
    const adjustedMaxY = Math.min(drawingCanvas.height, Math.ceil(maxY));
    
    const adjustedWidth = adjustedMaxX - adjustedMinX;
    const adjustedHeight = adjustedMaxY - adjustedMinY;
    
    // 調整後も最小サイズを満たすか確認
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
  
  // 整数座標に正規化
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
  
  // 矩形選択モードでデフォルト枠が表示されている場合は再描画
  if (getCurrentMode() === 'rectangle' && currentSelection) {
    // キャンバスサイズ変更に応じて枠を調整（画面の中心に配置）
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

// 物体検出モデルを読み込み（coco-ssd）
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
  // 検出モデルがない場合はnull
  if (!detectionModel) return null;
  try {
    // 現フレームから検出
    const predictions = await detectionModel.detect(video);
    // 信頼度で降順ソート
    predictions.sort((a, b) => b.score - a.score);
    // 上位から、極端に小さすぎないものを採用
    const minArea = (drawingCanvas.width * drawingCanvas.height) * 0.02; // 2%
    for (const p of predictions) {
      const [x, y, w, h] = p.bbox; // coco-ssdは動画要素座標基準
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
    
    // 初期モードに応じて設定
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
const FREEHAND_LINE_WIDTH = 6; // 少し細めに調整
const FREEHAND_STROKE_COLOR = '#000000'; // 黒に変更

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
  const handleSize = 12; // ハンドルのサイズ
  
  // 矩形を描画
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(minX, minY, width, height);
  ctx.setLineDash([]);
  
  // ハンドルを描画（四隅）
  ctx.fillStyle = '#007bff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  
  const handles = [
    { x: minX, y: minY, type: 'nw' }, // 左上
    { x: maxX, y: minY, type: 'ne' }, // 右上
    { x: minX, y: maxY, type: 'sw' }, // 左下
    { x: maxX, y: maxY, type: 'se' }  // 右下
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
  const tolerance = handleSize / 2 + 5; // クリック可能範囲を少し広げる
  
  // 四隅のハンドルをチェック
  if (Math.abs(mouseX - minX) < tolerance && Math.abs(mouseY - minY) < tolerance) return 'nw';
  if (Math.abs(mouseX - maxX) < tolerance && Math.abs(mouseY - minY) < tolerance) return 'ne';
  if (Math.abs(mouseX - minX) < tolerance && Math.abs(mouseY - maxY) < tolerance) return 'sw';
  if (Math.abs(mouseX - maxX) < tolerance && Math.abs(mouseY - maxY) < tolerance) return 'se';
  
  // 辺のハンドルをチェック
  if (Math.abs(mouseY - minY) < tolerance && mouseX >= minX && mouseX <= maxX) return 'n';
  if (Math.abs(mouseY - maxY) < tolerance && mouseX >= minX && mouseX <= maxX) return 's';
  if (Math.abs(mouseX - minX) < tolerance && mouseY >= minY && mouseY <= maxY) return 'w';
  if (Math.abs(mouseX - maxX) < tolerance && mouseY >= minY && mouseY <= maxY) return 'e';
  
  // 枠の内部をクリックした場合は移動
  if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) return 'move';
  
  return null;
}

// 矩形選択の描画（旧方式、互換性のため残す）
function drawRectangle(startX, startY, endX, endY) {
  // 既存の描画をクリア
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  
  // 矩形を描画
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  const maxX = Math.max(startX, endX);
  const maxY = Math.max(startY, endY);
  
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  ctx.setLineDash([]);
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

// マウス/タッチイベントハンドラ（モードに応じて切り替え）
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

// 統合されたイベントハンドラ（モードに応じて処理を分岐）
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

// イベントリスナーの設定（一度だけ）
function setupEventListeners() {
  drawingCanvas.style.pointerEvents = "auto";
  
  // マウスイベント
  drawingCanvas.addEventListener('mousedown', handleCanvasStart);
  drawingCanvas.addEventListener('mousemove', handleCanvasMove);
  drawingCanvas.addEventListener('mouseup', handleCanvasEnd);
  drawingCanvas.addEventListener('mouseleave', handleCanvasEnd);
  
  // タッチイベント
  drawingCanvas.addEventListener('touchstart', handleCanvasStart);
  drawingCanvas.addEventListener('touchmove', handleCanvasMove);
  drawingCanvas.addEventListener('touchend', handleCanvasEnd);
}

// フリーハンド描画のハンドラ
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

// リサイズ処理
function resizeSelection(handle, initialSel, initialMouse, currentMouse) {
  const dx = currentMouse.x - initialMouse.x;
  const dy = currentMouse.y - initialMouse.y;
  
  let { minX, minY, maxX, maxY } = { ...initialSel };
  
  switch (handle) {
    case 'nw': // 左上
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 'ne': // 右上
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 'sw': // 左下
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'se': // 右下
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'n': // 上辺
      minY = Math.max(0, Math.min(initialSel.minY + dy, initialSel.maxY - 20));
      break;
    case 's': // 下辺
      maxY = Math.min(drawingCanvas.height, Math.max(initialSel.maxY + dy, initialSel.minY + 20));
      break;
    case 'w': // 左辺
      minX = Math.max(0, Math.min(initialSel.minX + dx, initialSel.maxX - 20));
      break;
    case 'e': // 右辺
      maxX = Math.min(drawingCanvas.width, Math.max(initialSel.maxX + dx, initialSel.minX + 20));
      break;
    case 'move': // 移動
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

// 矩形選択のハンドラ（リサイズ可能な枠）
function handleRectangleStart(e) {
  if (getCurrentMode() !== 'rectangle') return;
  e.preventDefault();
  
  const coords = getCanvasCoordinates(e);
  
  // 既存の選択範囲がない場合は、デフォルトの枠を表示
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
  
  // どのハンドル（または枠）をクリックしたか判定
  resizeHandle = getResizeHandle(coords.x, coords.y, currentSelection);
  
  if (resizeHandle) {
    isResizing = true;
    initialSelection = { ...currentSelection };
    initialMousePos = { x: coords.x, y: coords.y };
    
    // カーソルスタイルを変更
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
  
  // リサイズ中の場合
  if (isResizing && resizeHandle && initialSelection) {
    e.preventDefault();
    currentSelection = resizeSelection(resizeHandle, initialSelection, initialMousePos, coords);
    clearCanvas();
    drawResizableRectangle(currentSelection);
    return;
  }
  
  // リサイズ中でない場合、カーソルを更新
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

// キャンバスをクリア
function clearCanvas() {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// モード変更時のイベントリスナー
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
    
    // モードに応じてキャンバスの描画設定とボタンの状態を調整
    const mode = getCurrentMode();
    if (mode === 'full') {
      drawingCanvas.style.pointerEvents = "none";
      // 素で判別モードでは常にボタンを有効化
      predictButton.disabled = false;
    } else if (mode === 'rectangle') {
      drawingCanvas.style.pointerEvents = "auto";
      // 矩形選択モードでは最初からデフォルト枠を表示
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

// 初期設定
setupEventListeners();

// 消去ボタンのイベントリスナー
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
  
  // モードに応じてボタンの状態を調整
  const mode = getCurrentMode();
  if (mode === 'rectangle') {
    // 矩形選択モードの場合はデフォルト枠を再表示
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

function applyBrightnessAdjustment(ctx, canvas, factor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * factor);
    data[i + 1] = Math.min(255, data[i + 1] * factor);
    data[i + 2] = Math.min(255, data[i + 2] * factor);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyHorizontalFlip(ctx, canvas, sourceCanvas) {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(sourceCanvas, -canvas.width, 0);
  ctx.restore();
}

function getAugmentationStrategy(sampleIndex) {
  const strategies = [
    { rotation: true, brightness: 0.5, flip: false },
    { rotation: false, brightness: 1.2, flip: false },
    { rotation: false, brightness: 0.8, flip: false },
    { rotation: true, brightness: 1.0, flip: true },
    { rotation: false, brightness: 1.0, flip: false },
    { rotation: true, brightness: 1.1, flip: false },
    { rotation: false, brightness: 0.9, flip: true },
    { rotation: true, brightness: 0.7, flip: false }
  ];

  return strategies[sampleIndex % strategies.length];
}

function evaluateImageQuality(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let brightness = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    brightness += gray;
    pixelCount++;
  }

  const avgBrightness = brightness / pixelCount;

  return {
    brightness: avgBrightness / 255,
    objectSize: canvas.width * canvas.height
  };
}

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
    // 素で判別：まず物体検出で自動領域抽出を試みる
    const detected = await getAutoBoundsForFullMode();
    if (detected) {
      rawBounds = detected;
    } else {
      // フォールバック：画像中央の少し小さめの領域（80%）を使用
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
    // 矩形選択モード
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
    // フリーハンドモード
    if (points.length < 2) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("囲いがありません。", true);
      return;
    }
    rawBounds = calculateOptimalBounds(points);
  }

  // 領域を正規化・検証
  const bounds = normalizeAndValidateBounds(rawBounds);
  
  if (!bounds) {
    showProgressIndicator(false);
    predictButton.disabled = false;
    // fullモードかつ検出モデルが未ロード/検出失敗の場合の案内を出す
    if (mode === 'full' && !detectionModel) {
      showNotification("モデル準備中です。数秒後にお試しください。", false, true);
    } else {
      showNotification("有効な領域を選択してください。", true);
    }
    return;
  }

  const { minX, minY, maxX, maxY, width, height } = bounds;

  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.drawImage(video, minX, minY, width, height, 0, 0, width, height);

  const quality = evaluateImageQuality(originalCanvas);

  if (quality.brightness < 0.2) {
    showNotification('もう少し明るい場所で試してください', false, true);
  } else if (quality.brightness > 0.95) {
    showNotification('逆光が強すぎます。角度を調整してください', false, true);
  }

  const predictions = [];
  const highConfidenceThreshold = 0.95;
  const mediumConfidenceThreshold = 0.85;
  const lowConfidenceThreshold = 0.70;
  const minimumConfidenceThreshold = 0.60;
  const totalSamples = 100;

  for (let i = 0; i < totalSamples; i++) {
    updateProgress(i + 1, totalSamples);

    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = width;
    processedCanvas.height = height;
    const processedCtx = processedCanvas.getContext('2d');

    const strategy = getAugmentationStrategy(i);

    if (strategy.rotation) {
      const rotationAngle = (Math.random() - 0.5) * 15 * Math.PI / 180;
      processedCtx.save();
      processedCtx.translate(width / 2, height / 2);
      processedCtx.rotate(rotationAngle);
      processedCtx.drawImage(originalCanvas, -width / 2, -height / 2, width, height);
      processedCtx.restore();
    } else {
      processedCtx.drawImage(originalCanvas, 0, 0);
    }

    if (strategy.flip) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(processedCanvas, 0, 0);
      applyHorizontalFlip(processedCtx, processedCanvas, tempCanvas);
    }

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = 224;
    resizedCanvas.height = 224;
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCtx.drawImage(processedCanvas, 0, 0, 224, 224);

    if (strategy.brightness !== 1.0) {
      applyBrightnessAdjustment(resizedCtx, resizedCanvas, strategy.brightness);
    }
    
    const enhancementOptions = {
      noiseReduction: Math.random() < 0.3,
      contrast: 0.8 + Math.random() * 0.4,
      sharpness: 0.8 + Math.random() * 0.4
    };
    applyImageEnhancement(resizedCtx, resizedCanvas, enhancementOptions);

    const resizedImageData = resizedCtx.getImageData(0, 0, 224, 224);

    const tensor = tf.tidy(() => {
      const pixelsTensor = tf.browser.fromPixels(resizedImageData).toFloat();
      return pixelsTensor.sub(IMAGENET_MEAN).div(IMAGENET_STD).expandDims();
    });

    const predictionArray = await model.predict(tensor).array();
    tensor.dispose();

    const scores = predictionArray ? predictionArray.flat() : [];
    const topResultIndex = scores.indexOf(Math.max(...scores));
    const topScore = scores[topResultIndex];
    const topLabel = classLabels.length > 0 && topResultIndex >= 0 ? classLabels[topResultIndex] : null;

    if (topLabel && topScore >= minimumConfidenceThreshold) {
      const confidenceVariance = calculateConfidenceVariance(scores);
      
      predictions.push({
        label: topLabel,
        confidence: topScore,
        variance: confidenceVariance,
        tier: topScore >= highConfidenceThreshold ? 'high' :
          topScore >= mediumConfidenceThreshold ? 'medium' :
            topScore >= lowConfidenceThreshold ? 'low' : 'verylow'
      });
    }
  }

  const weightedScores = {};
  const labelCounts = {};

  predictions.forEach(p => {
    const baseWeight = p.tier === 'high' ? 1.0 :
      p.tier === 'medium' ? 0.7 :
        p.tier === 'low' ? 0.4 : 0.1;
    
    const varianceWeight = Math.max(0.5, 1.0 - p.variance);
    const finalWeight = baseWeight * varianceWeight;

    if (!weightedScores[p.label]) {
      weightedScores[p.label] = 0;
      labelCounts[p.label] = 0;
    }

    weightedScores[p.label] += p.confidence * finalWeight;
    labelCounts[p.label]++;
  });

  let finalLabel = null;
  let maxAvgWeightedScore = 0;
  let finalCount = 0;

  Object.keys(weightedScores).forEach(label => {
    const avgWeightedScore = weightedScores[label] / labelCounts[label];
    if (avgWeightedScore > maxAvgWeightedScore) {
      maxAvgWeightedScore = avgWeightedScore;
      finalLabel = label;
      finalCount = labelCounts[label];
    }
  });

  showProgressIndicator(false);

  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }

  const bubbleText = document.getElementById('bubbleText');
  const rawConfidence = Math.round((finalCount / totalSamples) * 100);

  if (finalLabel && rawConfidence >= 50) {
    const labelData = labelInfo[finalLabel];
    const convertedConfidence = Math.round(((rawConfidence - 50) / 50) * 100);
    const template = `なまえ：${labelData.name}\n種類　：${labelData.category}\n説明　：${labelData.description}\n一致回数：${finalCount}/${totalSamples}回\n信頼度：${convertedConfidence}%`;

    await new Promise(resolve => setTimeout(resolve, 200));

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
      count: finalCount,
      total: totalSamples,
      confidence: maxAvgWeightedScore
    };
    saveButton.disabled = false;

  } else {
    const camera = document.querySelector('#mainCamera');
    if (!camera || !camera.object3D) {
      predictButton.disabled = false;
      return;
    }

    infoBubble.setAttribute('visible', true);
    bubbleText.setAttribute('value', `分類できませんでした。\n別の角度から試してください。`);
    const cameraWorldPosition = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraWorldPosition);
    const infoBubblePosition = new THREE.Vector3(0, 0, -2);
    infoBubblePosition.applyQuaternion(camera.object3D.quaternion);
    infoBubblePosition.add(cameraWorldPosition);
    infoBubble.setAttribute('position', infoBubblePosition);

    saveButton.disabled = true;
  }

  // 描画をクリア（モードに応じて）
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

  // 保存ボタンを一時的に無効化して二重登録を防ぐ
  saveButton.disabled = true;
  showNotification('登録中...', false, false);

  const { label, count, total, confidence } = lastPrediction;
  const now = new Date().toISOString();
  const labelData = labelInfo[label];
  
  // 位置情報がある場合は住所を取得
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
      address: address  // 住所を追加
    };
  }
  
  const entry = {
    name: labelData.name,
    category: labelData.category,
    description: labelData.description,
    date: now,
    matchCount: count,
    totalSamples: total,
    confidence: confidence,
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