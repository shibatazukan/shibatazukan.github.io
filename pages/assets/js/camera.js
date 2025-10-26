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

// ImageNet標準化用の定数
const IMAGENET_MEAN = tf.tensor1d([123.68, 116.779, 103.939]);
const IMAGENET_STD  = tf.tensor1d([58.393, 57.12, 57.375]);

// A-Frameコンポーネント: 完全にカメラを向く
AFRAME.registerComponent('face-camera-full', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (camera) {
      const cameraPosition = new THREE.Vector3();
      camera.object3D.getWorldPosition(cameraPosition);
      
      const thisPosition = new THREE.Vector3();
      this.el.object3D.getWorldPosition(thisPosition);
      
      // カメラの方向を向く
      this.el.object3D.lookAt(cameraPosition);
      
      // Z軸回転をリセット（テキストが傾かないように）
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
 * 画像のノイズ除去とコントラスト調整を行う関数
 */
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

function calculateOptimalBounds(points) {
  if (points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  const xValues = points.map(p => p.x).sort((a, b) => a - b);
  const yValues = points.map(p => p.y).sort((a, b) => a - b);
  
  const xQ1 = xValues[Math.floor(xValues.length * 0.25)];
  const xQ3 = xValues[Math.floor(xValues.length * 0.75)];
  const yQ1 = yValues[Math.floor(yValues.length * 0.25)];
  const yQ3 = yValues[Math.floor(yValues.length * 0.75)];
  
  const xIQR = xQ3 - xQ1;
  const yIQR = yQ3 - yQ1;
  
  const xLowerBound = xQ1 - 1.5 * xIQR;
  const xUpperBound = xQ3 + 1.5 * xIQR;
  const yLowerBound = yQ1 - 1.5 * yIQR;
  const yUpperBound = yQ3 + 1.5 * yIQR;
  
  const filteredPoints = points.filter(p => 
    p.x >= xLowerBound && p.x <= xUpperBound &&
    p.y >= yLowerBound && p.y <= yUpperBound
  );
  
  const validPoints = filteredPoints.length >= 2 ? filteredPoints : points;
  
  const minX = Math.min(...validPoints.map(p => p.x));
  const minY = Math.min(...validPoints.map(p => p.y));
  const maxX = Math.max(...validPoints.map(p => p.x));
  const maxY = Math.max(...validPoints.map(p => p.y));
  
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
}
window.addEventListener('resize', resizeCanvas);
video.addEventListener('loadedmetadata', resizeCanvas);

tf.loadLayersModel(modelPath).then(m => model = m).catch(err => {
  showNotification("モデルの読み込みに失敗しました。", true);
  console.error("Model load error:", err);
});

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
    drawingCanvas.style.pointerEvents = "auto";
    showNotification("カメラ準備完了。対象を囲んでください。");

  } catch (err) {
    showNotification("カメラへのアクセスを許可してください。", true);
    startScreen.style.display = 'flex';
  }
}

startButton.addEventListener('click', () => {
  setupCamera();
});

ctx.strokeStyle = '#007bff';
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

drawingCanvas.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) return;
  e.preventDefault();
  isDrawing = true;
  const t = e.touches[0];
  points = [{
    x: t.clientX,
    y: t.clientY
  }];
  ctx.beginPath();
  ctx.moveTo(t.clientX, t.clientY);
});

drawingCanvas.addEventListener('touchmove', e => {
  if (!isDrawing || e.touches.length !== 1) return;
  e.preventDefault();
  const t = e.touches[0];
  points.push({
    x: t.clientX,
    y: t.clientY
  });
  ctx.lineTo(t.clientX, t.clientY);
  ctx.stroke();
  predictButton.disabled = false;
});

drawingCanvas.addEventListener('touchend', () => {
  isDrawing = false;
  ctx.closePath();
});

clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  points = [];
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
  if (!model || points.length < 2) {
    showNotification("囲いがありません。", true);
    return;
  }

  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  const bounds = calculateOptimalBounds(points);
  const { minX, minY, maxX, maxY, width, height } = bounds;

  if (width <= 0 || height <= 0 || width * height < 100) {
    showProgressIndicator(false);
    predictButton.disabled = false;
    showNotification("小さすぎる領域です。", true);
    return;
  }

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

  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  points = [];
  predictButton.disabled = false;
});

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


// バブルをカメラのY軸回転に合わせて常に正面に向かせるコンポーネント
AFRAME.registerComponent('face-camera-full', {
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
// A-Frameコンポーネント: 完全にカメラを向く
AFRAME.registerComponent('face-camera-full', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (camera) {
      // カメラの向きをそのままコピー
      const cameraQuaternion = camera.object3D.quaternion.clone();
      this.el.object3D.quaternion.copy(cameraQuaternion);
      
      // カメラの「前方」ベクトルを取得
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(cameraQuaternion);
      
      // オブジェクトをカメラから2m前方に配置
      const cameraPosition = new THREE.Vector3();
      camera.object3D.getWorldPosition(cameraPosition);
      
      const targetPosition = cameraPosition.clone().add(forward.multiplyScalar(2));
      this.el.object3D.position.copy(targetPosition);
    }
  }
});
