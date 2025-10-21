// 定数
const modelPath = 'model/model.json';
const classLabels = ['あやめ', 'さくら', 'とんぼ', 'カブトムシ', 'クワガタ'];
const labelInfo = {
  'あやめ': {
    name: 'あやめ',
    category: '草花',
    description: '紫色や青い花が\n咲く春の花。\n水辺が好きです。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'さくら': {
    name: 'さくら',
    category: '木の花',
    description: 'ピンク色の\nきれいな花。\n春の代表的な花です。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'とんぼ': {
    name: 'とんぼ',
    category: '昆虫',
    description: '大きな羽をもつ\n夏の虫。空をすばやく\n飛ぶことができます。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'カブトムシ': {
    name: 'カブトムシ',
    category: '昆虫',
    description: '黒い体と角が\n特徴の昆虫。夏に\nクワガタと一緒に活動します。',
    show3DObject: false,
    model: 'model/model.json'
  },
  'クワガタ': {
    name: 'クワガタ',
    category: '昆虫',
    description: '大きなあごが\n特徴の昆虫。\n夏に活躍します。',
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

// ImageNet標準化用の定数
const IMAGENET_MEAN = tf.tensor1d([123.68, 116.779, 103.939]);
const IMAGENET_STD = tf.tensor1d([58.393, 57.12, 57.375]);

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
    drawingCanvas.style.pointerEvents = "auto";
    showNotification("カメラ準備完了。対象を囲んでください。");

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

// 描画イベント（タッチデバイス用）
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

// 消去ボタンのイベントリスナー
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
  if (!model || points.length < 2) {
    showNotification("囲いがありません。", true);
    return;
  }

  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  // 囲まれた領域の座標を計算
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));
  const width = maxX - minX;
  const height = maxY - minY;

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
  const highConfidenceThreshold = 0.98;
  const mediumConfidenceThreshold = 0.90;
  const lowConfidenceThreshold = 0.75;
  const totalSamples = 50;

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

    if (topLabel) {
      predictions.push({
        label: topLabel,
        confidence: topScore,
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
    // 確信度階層に応じて重み付け
    const weight = p.tier === 'high' ? 1.0 :
                   p.tier === 'medium' ? 0.7 :
                   p.tier === 'low' ? 0.4 : 0.1;

    if (!weightedScores[p.label]) {
      weightedScores[p.label] = 0;
      labelCounts[p.label] = 0;
    }

    weightedScores[p.label] += p.confidence * weight;
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

  // 描画をクリア
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  points = [];
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
  tick: function() {
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
  tick: function() {
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
