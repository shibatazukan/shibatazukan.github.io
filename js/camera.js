// 定数
const modelPath = 'model/model.json';
const classLabels = ['あやめ', 'さくら', '赤とんぼ', 'カブトムシ', 'クワガタ'];
const labelInfo = {
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
const video = document.getElementById('webcam');
const drawingCanvas = document.getElementById('drawingCanvas');
const ctx = drawingCanvas.getContext('2d');
const predictButton = document.getElementById('predictButton');
const saveButton = document.getElementById('saveButton');
const clearButton = document.getElementById('clearButton');
const controlPanel = document.getElementById('controlPanel');
const modeSelector = document.getElementById('modeSelector');
const scene = document.querySelector('a-scene');
const infoBubble = document.getElementById('infoBubble');
const notificationMessage = document.getElementById('notificationMessage');
const progressIndicator = document.getElementById('progressIndicator');
const progressText = document.getElementById('progressText');
const progressFill = document.querySelector('.progress-fill');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// グローバル変数
let model;
let isDrawing = false;
let points = [];
let identifiedObject = null;
let lastPrediction = null;

// 矩形選択用の変数
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };
let currentSelection = null; // { minX, minY, maxX, maxY }

// 現在のモードを取得
function getCurrentMode() {
  const selected = document.querySelector('input[name="selectionMode"]:checked');
  return selected ? selected.value : 'full';
}

// ImageNet標準化用の定数
const IMAGENET_MEAN = tf.tensor1d([123.68, 116.779, 103.939]);
const IMAGENET_STD = tf.tensor1d([58.393, 57.12, 57.375]);

/**
 * 画像のノイズ除去とコントラスト調整を行う関数
 * @param {CanvasRenderingContext2D} ctx - コンテキスト
 * @param {HTMLCanvasElement} canvas - キャンバス
 * @param {Object} options - 処理オプション
 */
function applyImageEnhancement(ctx, canvas, options = {}) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // ガウシアンブラーでノイズ除去
  if (options.noiseReduction) {
    applyGaussianBlur(data, canvas.width, canvas.height, 1);
  }
  
  // コントラスト調整
  if (options.contrast !== 1.0) {
    applyContrastAdjustment(data, options.contrast);
  }
  
  // シャープネス調整
  if (options.sharpness !== 1.0) {
    applySharpnessAdjustment(data, canvas.width, canvas.height, options.sharpness);
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * ガウシアンブラーを適用
 */
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

/**
 * コントラスト調整
 */
function applyContrastAdjustment(data, contrast) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
}

/**
 * シャープネス調整
 */
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

/**
 * 信頼度の分散を計算
 * 予測の安定性を評価するために使用
 */
function calculateConfidenceVariance(scores) {
  if (scores.length < 2) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  return Math.sqrt(variance); // 標準偏差を返す
}

/**
 * 最適化された境界計算
 * フリーハンド描画の外れ値を除去し、より正確な領域を計算
 */
function calculateOptimalBounds(points) {
  if (points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  // 外れ値除去（四分位範囲を使用）
  const xValues = points.map(p => p.x).sort((a, b) => a - b);
  const yValues = points.map(p => p.y).sort((a, b) => a - b);
  
  const xQ1 = xValues[Math.floor(xValues.length * 0.25)];
  const xQ3 = xValues[Math.floor(xValues.length * 0.75)];
  const yQ1 = yValues[Math.floor(yValues.length * 0.25)];
  const yQ3 = yValues[Math.floor(yValues.length * 0.75)];
  
  const xIQR = xQ3 - xQ1;
  const yIQR = yQ3 - yQ1;
  
  // 外れ値の閾値
  const xLowerBound = xQ1 - 1.5 * xIQR;
  const xUpperBound = xQ3 + 1.5 * xIQR;
  const yLowerBound = yQ1 - 1.5 * yIQR;
  const yUpperBound = yQ3 + 1.5 * yIQR;
  
  // 外れ値を除去した点の集合
  const filteredPoints = points.filter(p => 
    p.x >= xLowerBound && p.x <= xUpperBound &&
    p.y >= yLowerBound && p.y <= yUpperBound
  );
  
  // フィルタリング後の点が少なすぎる場合は元の点を使用
  const validPoints = filteredPoints.length >= 2 ? filteredPoints : points;
  
  const minX = Math.min(...validPoints.map(p => p.x));
  const minY = Math.min(...validPoints.map(p => p.y));
  const maxX = Math.max(...validPoints.map(p => p.x));
  const maxY = Math.max(...validPoints.map(p => p.y));
  
  // パディングを追加（境界を少し拡張）
  const padding = Math.min(10, Math.min(maxX - minX, maxY - minY) * 0.1);
  
  return {
    minX: Math.max(0, minX - padding),
    minY: Math.max(0, minY - padding),
    maxX: Math.min(drawingCanvas.width, maxX + padding),
    maxY: Math.min(drawingCanvas.height, maxY + padding),
    width: Math.max(0, maxX - minX + 2 * padding),
    height: Math.max(0, maxY - minY + 2 * padding)
  };
}

/**
 * 通知メッセージを表示する関数
 * @param {string} message - 表示するメッセージ
 * @param {boolean} isError - エラー表示か
 * @param {boolean} isWarning - 警告表示か
 */
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

/**
 * プログレスインジケーターを更新する関数
 * @param {number} current - 現在のステップ
 * @param {number} total - 全体のステップ数
 */
function updateProgress(current, total) {
  progressText.textContent = `${current}/${total}`;
  const percentage = (current / total) * 100;
  progressFill.style.width = percentage + '%';
}

/**
 * プログレスインジケーターの表示/非表示を切り替える関数
 * @param {boolean} show - trueで表示、falseで非表示
 */
function showProgressIndicator(show = true) {
  progressIndicator.style.display = show ? 'block' : 'none';
}

/**
 * キャンバスのサイズをビデオ要素に合わせる関数
 */
function resizeCanvas() {
  drawingCanvas.width = video.offsetWidth;
  drawingCanvas.height = video.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
video.addEventListener('loadedmetadata', resizeCanvas);

// モデルの読み込み
tf.loadLayersModel(modelPath).then(m => model = m).catch(err => {
  showNotification("モデルの読み込みに失敗しました。", true);
  console.error("Model load error:", err);
});

/**
 * カメラを起動する関数
 */
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
    await new Promise(resolve => setTimeout(resolve, 1500)); // ARシーンの準備を待つ

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

  } catch (err) {
    showNotification("カメラへのアクセスを許可してください。", true);
    startScreen.style.display = 'flex';
  }
}

// 起動ボタンのイベントリスナー
startButton.addEventListener('click', () => {
  setupCamera();
});

// キャンバス描画設定
ctx.strokeStyle = '#007bff';
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// 矩形選択の描画
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
  
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 5;
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

// 矩形選択のハンドラ
function handleRectangleStart(e) {
  if (getCurrentMode() !== 'rectangle') return;
  e.preventDefault();
  isSelecting = true;
  const coords = getCanvasCoordinates(e);
  selectionStart = coords;
  selectionEnd = coords;
  currentSelection = null;
}

function handleRectangleMove(e) {
  if (!isSelecting || getCurrentMode() !== 'rectangle') return;
  e.preventDefault();
  const coords = getCanvasCoordinates(e);
  selectionEnd = coords;
  drawRectangle(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
}

function handleRectangleEnd(e) {
  if (getCurrentMode() !== 'rectangle') return;
  e.preventDefault();
  isSelecting = false;
  
  if (selectionStart && selectionEnd) {
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);
    
    if (maxX - minX > 10 && maxY - minY > 10) {
      currentSelection = { minX, minY, maxX, maxY };
      predictButton.disabled = false;
    }
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
    
    // モードに応じてキャンバスの描画設定とボタンの状態を調整
    const mode = getCurrentMode();
    if (mode === 'full') {
      drawingCanvas.style.pointerEvents = "none";
      // 素で判別モードでは常にボタンを有効化
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
  predictButton.disabled = true;
  saveButton.disabled = true;
  infoBubble.setAttribute('visible', false);
  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }
  lastPrediction = null;
  showProgressIndicator(false);
});


// --- 画像オーギュメンテーション・評価関数群 ---

/**
 * 明るさ調整を適用する
 */
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

/**
 * 左右反転を適用する
 */
function applyHorizontalFlip(ctx, canvas, sourceCanvas) {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(sourceCanvas, -canvas.width, 0);
  ctx.restore();
}

/**
 * サンプリングごとのオーギュメンテーション戦略を決定する
 */
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

/**
 * 画像品質を評価する（簡易）
 */
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


// --- 識別処理関数 ---

predictButton.addEventListener('click', async () => {
  if (!model) {
    showNotification("モデルが読み込まれていません。", true);
    return;
  }

  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  // モードに応じて領域を決定
  let bounds = null;
  const mode = getCurrentMode();
  
  if (mode === 'full') {
    // 素で判別：画像全体を使用
    bounds = {
      minX: 0,
      minY: 0,
      maxX: drawingCanvas.width,
      maxY: drawingCanvas.height,
      width: drawingCanvas.width,
      height: drawingCanvas.height
    };
  } else if (mode === 'rectangle') {
    // 矩形選択モード
    if (!currentSelection) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("領域を選択してください。", true);
      return;
    }
    bounds = {
      minX: currentSelection.minX,
      minY: currentSelection.minY,
      maxX: currentSelection.maxX,
      maxY: currentSelection.maxY,
      width: currentSelection.maxX - currentSelection.minX,
      height: currentSelection.maxY - currentSelection.minY
    };
  } else if (mode === 'freehand') {
    // フリーハンドモード
    if (points.length < 2) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("囲いがありません。", true);
      return;
    }
    bounds = calculateOptimalBounds(points);
  }

  const { minX, minY, maxX, maxY, width, height } = bounds;

  if (width <= 0 || height <= 0 || width * height < 100) {
    showProgressIndicator(false);
    predictButton.disabled = false;
    showNotification("小さすぎる領域です。", true);
    return;
  }

  // 1. 囲まれた領域をトリミング
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.drawImage(video, minX, minY, width, height, 0, 0, width, height);

  // 2. 画像品質チェックと通知
  const quality = evaluateImageQuality(originalCanvas);

  if (quality.brightness < 0.2) {
    showNotification('もう少し明るい場所で試してください', false, true);
  } else if (quality.brightness > 0.95) {
    showNotification('逆光が強すぎます。角度を調整してください', false, true);
  }

  // 3. データオーギュメンテーションと予測（アンサンブル学習風）
  const predictions = [];
  const highConfidenceThreshold = 0.95; // より厳格な閾値
  const mediumConfidenceThreshold = 0.85;
  const lowConfidenceThreshold = 0.70;
  const minimumConfidenceThreshold = 0.60; // 最低信頼度閾値
  const totalSamples = 100; // サンプリング回数を倍増

  for (let i = 0; i < totalSamples; i++) {
    updateProgress(i + 1, totalSamples);

    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = width;
    processedCanvas.height = height;
    const processedCtx = processedCanvas.getContext('2d');

    const strategy = getAugmentationStrategy(i);

    // 回転を適用
    if (strategy.rotation) {
      const rotationAngle = (Math.random() - 0.5) * 15 * Math.PI / 180; // ±7.5度
      processedCtx.save();
      processedCtx.translate(width / 2, height / 2);
      processedCtx.rotate(rotationAngle);
      processedCtx.drawImage(originalCanvas, -width / 2, -height / 2, width, height);
      processedCtx.restore();
    } else {
      processedCtx.drawImage(originalCanvas, 0, 0);
    }

    // 左右反転を適用
    if (strategy.flip) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(processedCanvas, 0, 0);
      applyHorizontalFlip(processedCtx, processedCanvas, tempCanvas);
    }

    // リサイズ（224x224）
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = 224;
    resizedCanvas.height = 224;
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCtx.drawImage(processedCanvas, 0, 0, 224, 224);

    // 明度調整を適用
    if (strategy.brightness !== 1.0) {
      applyBrightnessAdjustment(resizedCtx, resizedCanvas, strategy.brightness);
    }
    
    // 画像品質向上処理を適用
    const enhancementOptions = {
      noiseReduction: Math.random() < 0.3, // 30%の確率でノイズ除去
      contrast: 0.8 + Math.random() * 0.4, // 0.8-1.2の範囲でコントラスト調整
      sharpness: 0.8 + Math.random() * 0.4  // 0.8-1.2の範囲でシャープネス調整
    };
    applyImageEnhancement(resizedCtx, resizedCanvas, enhancementOptions);

    const resizedImageData = resizedCtx.getImageData(0, 0, 224, 224);

    // ImageNet標準化とTensorFlow.jsでの予測
    const tensor = tf.tidy(() => {
      const pixelsTensor = tf.browser.fromPixels(resizedImageData).toFloat();
      // VGG16/ResNetなどによく使われるImageNet標準化
      return pixelsTensor.sub(IMAGENET_MEAN).div(IMAGENET_STD).expandDims();
    });

    const predictionArray = await model.predict(tensor).array();
    tensor.dispose();

    const scores = predictionArray ? predictionArray.flat() : [];
    const topResultIndex = scores.indexOf(Math.max(...scores));
    const topScore = scores[topResultIndex];
    const topLabel = classLabels.length > 0 && topResultIndex >= 0 ? classLabels[topResultIndex] : null;

    if (topLabel && topScore >= minimumConfidenceThreshold) {
      // 信頼度の分散を計算（より安定した予測のため）
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

  // 4. 加重平均スコアで結果を集計
  const weightedScores = {};
  const labelCounts = {};

  predictions.forEach(p => {
    // 確信度階層と分散に応じて重み付け
    const baseWeight = p.tier === 'high' ? 1.0 :
      p.tier === 'medium' ? 0.7 :
        p.tier === 'low' ? 0.4 : 0.1;
    
    // 分散が小さい（安定した予測）ほど重みを増加
    const varianceWeight = Math.max(0.5, 1.0 - p.variance);
    const finalWeight = baseWeight * varianceWeight;

    if (!weightedScores[p.label]) {
      weightedScores[p.label] = 0;
      labelCounts[p.label] = 0;
    }

    weightedScores[p.label] += p.confidence * finalWeight;
    labelCounts[p.label]++;
  });

  // 5. 最終ラベルを決定
  let finalLabel = null;
  let maxAvgWeightedScore = 0;
  let finalCount = 0;

  Object.keys(weightedScores).forEach(label => {
    // 加重平均スコア（平均重み付き確信度）
    const avgWeightedScore = weightedScores[label] / labelCounts[label];
    if (avgWeightedScore > maxAvgWeightedScore) {
      maxAvgWeightedScore = avgWeightedScore;
      finalLabel = label;
      finalCount = labelCounts[label];
    }
  });

  showProgressIndicator(false);

  // 6. AR表示の更新
  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }

  const bubbleText = document.getElementById('bubbleText');
  const rawConfidence = Math.round((finalCount / totalSamples) * 100);

  if (finalLabel && rawConfidence >= 50) { // 50%以上の賛成票（サンプリング回数）で採用
    const labelData = labelInfo[finalLabel];
    // 50%～100%の結果を0%～100%に再マップして表示（より分かりやすく）
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

    // カメラの正面少し下に情報バブルを配置
    const cameraWorldPosition = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraWorldPosition);

    // カメラからZ軸方向に-2mの位置
    const infoBubblePosition = new THREE.Vector3(0, 0, -2);
    // カメラの向きに合わせて回転を適用
    infoBubblePosition.applyQuaternion(camera.object3D.quaternion);
    // カメラの位置を足してワールド座標へ
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

    // 3Dオブジェクトの表示はスキップされているので、ここではコメントアウトまたはカスタマイズ
    /*
    if (labelData.show3DObject) {
      // 3Dオブジェクトの表示ロジック
    }
    */
  } else {
    // 識別失敗
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


// --- 図鑑登録処理 ---

saveButton.addEventListener('click', () => {
  if (!lastPrediction) return;

  const { label, count, total, confidence } = lastPrediction;
  const now = new Date().toISOString();
  const labelData = labelInfo[label];
  const entry = {
    name: labelData.name,
    category: labelData.category,
    description: labelData.description,
    date: now,
    matchCount: count,
    totalSamples: total,
    confidence: confidence
  };

  let zukan = JSON.parse(localStorage.getItem('myZukan') || '[]');

  const exists = zukan.some(item => item.name === entry.name);

  if (!exists) {
    zukan.push(entry);
    localStorage.setItem('myZukan', JSON.stringify(zukan));
    showNotification('「' + labelData.name + '」をマイずかんに登録しました！');
  } else {
    showNotification('「' + labelData.name + '」はすでに登録済みです。', true);
  }

  saveButton.disabled = true;
  lastPrediction = null;
});


// --- A-Frame コンポーネント ---

// バブルをカメラのY軸回転に合わせて常に正面に向かせるコンポーネント
AFRAME.registerComponent('face-camera-y', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    const obj3D = this.el.object3D;
    const cameraPos = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraPos);
    const objPos = new THREE.Vector3();
    obj3D.getWorldPosition(objPos);
    const dir = new THREE.Vector3().subVectors(cameraPos, objPos);
    dir.y = 0; // Y軸方向は無視して水平回転のみ
    dir.normalize();
    // カメラの方向からバブルへの角度を計算して回転
    obj3D.rotation.y = Math.atan2(dir.x, dir.z);
  }
});

// バブルの尻尾を識別対象の3Dオブジェクトに向けるコンポーネント
AFRAME.registerComponent('tail-update', {
  tick: function () {
    if (!identifiedObject || !infoBubble.getAttribute('visible')) {
      return;
    }

    const bubblePos = new THREE.Vector3();
    infoBubble.object3D.getWorldPosition(bubblePos);
    const targetPos = new THREE.Vector3();
    identifiedObject.object3D.getWorldPosition(targetPos);

    const dir = new THREE.Vector3().subVectors(targetPos, bubblePos);
    dir.y = 0; // 水平方向のみ
    if (dir.length() < 0.001) {
      return;
    }
    dir.normalize();
    const angle = Math.atan2(dir.x, dir.z) * (180 / Math.PI); // 角度に変換
    const tailBlack = infoBubble.querySelector('#tailBlack');
    const tailWhite = infoBubble.querySelector('#tailWhite');
    if (tailBlack) tailBlack.setAttribute('rotation', `0 ${angle} 0`);
    if (tailWhite) tailWhite.setAttribute('rotation', `0 ${angle} 0`);
  }
});
