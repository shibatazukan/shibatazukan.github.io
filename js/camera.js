// A-Frameコンポーネント: 完全にカメラを向く
AFRAME.registerComponent('face-camera-full', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (camera) {
      const cameraPosition = camera.object3D.getWorldPosition(new THREE.Vector3());
      const thisPosition = this.el.object3D.getWorldPosition(new THREE.Vector3());
      
      // カメラに向かせる
      this.el.object3D.lookAt(cameraPosition);
      
      // Y軸周りの回転を保持して、上下反転を防ぐ
      const currentRotation = this.el.object3D.rotation;
      this.el.object3D.rotation.z = 0;
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

    const bubblePos = this.el.object3D.position;
    const cameraPos = camera.object3D.position;

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

let model = null;
let labelList = [];
let video, canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentPrediction = null;
let gyroscopeData = { alpha: 0, beta: 0, gamma: 0 };

const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const predictButton = document.getElementById('predictButton');
const saveButton = document.getElementById('saveButton');
const clearButton = document.getElementById('clearButton');
const progressIndicator = document.getElementById('progressIndicator');
const progressText = document.getElementById('progressText');
const progressFill = document.querySelector('.progress-fill');
const notificationMessage = document.getElementById('notificationMessage');

// 開始ボタンのイベント
startButton.addEventListener('click', async () => {
  try {
    await initCamera();
    await loadModel();
    startScreen.style.display = 'none';
    predictButton.disabled = false;
    
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (error) {
        console.log('ジャイロスコープ許可エラー:', error);
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  } catch (error) {
    alert('初期化エラー: ' + error.message);
  }
});

// カメラ初期化
async function initCamera() {
  video = document.getElementById('webcam');
  canvas = document.getElementById('drawingCanvas');
  ctx = canvas.getContext('2d');

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve();
    };
  });

  setupDrawing();
}

// 描画機能のセットアップ
function setupDrawing() {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  canvas.addEventListener('touchend', () => {
    isDrawing = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });
}

// モデル読み込み
async function loadModel() {
  try {
    model = await tf.loadLayersModel('../../model/model.json');
    const response = await fetch('../../model/labels.txt');
    const text = await response.text();
    labelList = text.trim().split('\n');
  } catch (error) {
    throw new Error('モデルの読み込みに失敗しました: ' + error.message);
  }
}

// ジャイロスコープデータ処理
function handleOrientation(event) {
  gyroscopeData.alpha = event.alpha || 0;
  gyroscopeData.beta = event.beta || 0;
  gyroscopeData.gamma = event.gamma || 0;
}

// 分類ボタン
predictButton.addEventListener('click', async () => {
  if (!model) {
    showNotification('モデルが読み込まれていません', 'error');
    return;
  }

  predictButton.disabled = true;
  progressIndicator.style.display = 'block';

  try {
    const imageData = getCanvasRegion();
    if (!imageData) {
      showNotification('画像領域を指定してください', 'error');
      predictButton.disabled = false;
      progressIndicator.style.display = 'none';
      return;
    }

    const predictions = await classifyImage(imageData);
    currentPrediction = predictions[0];

    displayARResult(currentPrediction);
    saveButton.disabled = false;
    showNotification('分類が完了しました', 'success');
  } catch (error) {
    showNotification('分類エラー: ' + error.message, 'error');
  } finally {
    predictButton.disabled = false;
    progressIndicator.style.display = 'none';
  }
});

// キャンバスの描画領域を取得
function getCanvasRegion() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let minX = canvas.width, minY = canvas.height;
  let maxX = 0, maxY = 0;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx] > 0 || data[idx + 1] > 0 || data[idx + 2] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (maxX <= minX || maxY <= minY) return null;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.drawImage(video, minX, minY, width, height, 0, 0, width, height);
  
  return tempCanvas;
}

// 画像分類
async function classifyImage(imageCanvas) {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imageCanvas)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    const predictions = model.predict(tensor);
    const scores = predictions.dataSync();
    
    const results = labelList.map((label, i) => ({
      label: label,
      score: scores[i]
    }));
    
    results.sort((a, b) => b.score - a.score);
    return results;
  });
}

// AR結果表示
function displayARResult(prediction) {
  const infoBubble = document.getElementById('infoBubble');
  const bubbleText = document.getElementById('bubbleText');
  
  const confidence = (prediction.score * 100).toFixed(1);
  bubbleText.setAttribute('value', `${prediction.label}\n確信度: ${confidence}%`);
  
  const camera = document.querySelector('#mainCamera');
  const cameraPosition = camera.object3D.position;
  const cameraRotation = camera.object3D.rotation;
  
  const distance = 2;
  const bubbleX = cameraPosition.x - Math.sin(cameraRotation.y) * distance;
  const bubbleY = cameraPosition.y;
  const bubbleZ = cameraPosition.z - Math.cos(cameraRotation.y) * distance;
  
  infoBubble.setAttribute('position', `${bubbleX} ${bubbleY} ${bubbleZ}`);
  infoBubble.setAttribute('visible', 'true');
}

// 登録ボタン
saveButton.addEventListener('click', () => {
  if (!currentPrediction) return;
  
  const data = {
    label: currentPrediction.label,
    confidence: currentPrediction.score,
    timestamp: new Date().toISOString(),
    gyroscope: gyroscopeData
  };
  
  console.log('保存データ:', data);
  showNotification(`「${currentPrediction.label}」を登録しました`, 'success');
  saveButton.disabled = true;
});

// 消去ボタン
clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const infoBubble = document.getElementById('infoBubble');
  infoBubble.setAttribute('visible', 'false');
  currentPrediction = null;
  saveButton.disabled = true;
});

// 通知表示
function showNotification(message, type) {
  notificationMessage.textContent = message;
  notificationMessage.className = type;
  notificationMessage.style.display = 'block';
  
  setTimeout(() => {
    notificationMessage.style.display = 'none';
  }, 3000);
}