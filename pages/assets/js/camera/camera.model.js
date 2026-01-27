// camera.model.js
// モデル読み込み、カメラセットアップ、分類・保存処理

/*
// tfモデル読み込み
tf.loadLayersModel(modelPath).then(m => model = m).catch(err => {
  showNotification("モデルの読み込みに失敗しました。", true);
  console.error("Model load error:", err);
});
*/

/*
async function requestGyroPermission() {
  if (typeof DeviceMotionEvent === "undefined") return true;
  if (typeof DeviceMotionEvent.requestPermission !== "function") return true;

  try {
    const res = await DeviceMotionEvent.requestPermission();
    return res === "granted";
  } catch (e) {
    return false;
  }
}
*/

/*
async function ensureModelLoaded() {
  if (model) return true;
  try {
    model = await tf.loadLayersModel(modelPath);
    return true;
  } catch (e) {
    showNotification("モデルの読み込みに失敗しました。", true);
    return false;
  }
}
*/

let modelLoding = false;

async function ensureModelLoaded() {

  if (model) return true;
  if (modelLoading) return false;

  modelLoading = true;

  try {
    model = await tf.loadLayersModel(modelPath);
    return true;

  } catch (e) {
    console.error('model load error', e);
    showNotification('モデルの読み込みに失敗しました', true);
    return false;

  } finally {
    modelLoading = false;
  }
}

// 物体検出モデルを読み込み
/*
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
*/

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

/*
startButton.addEventListener('click', async () => {
  // ジャイロセンサーモーション モーダル
   try {
    // iOS 13+ 用
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission()
      if (res !== 'granted') {
        // alert('拒否されました')
      }
      else {
       // alert('ジャイロセンサが許可されました')
      }
    }
     
    // 動いてるか確認用
    
    window.addEventListener('deviceorientation', e => {
      if (e.alpha == null) return
      console.log(e.alpha, e.beta, e.gamma)
    })
    

  } catch (e) {
    alert('エラー')
    console.error(e)
  }
  // ジャイロセンサーモーション モーダル
  
  setupCamera();

});
*/

/*
startButton.addEventListener('click', async () => {
  try {
    // ジャイロ
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const res = await DeviceOrientationEvent.requestPermission();

      if (res !== 'granted') {
        showNotification('ジャイロを許可してください');
      }
    }
    
    // window.addEventListener("deviceorientation", handleOrientation, true);

    // ジャイロ許可後にカメラ
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:'environment' },
      audio: false
    });

    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play(), { once: true });

    startScreen.style.display = 'none';
    controlPanel.style.display = 'flex';

  } catch (e) {
    showNotification('初期化に失敗しました');
    console.error(e);
  }
});
*/

// ===== ジャイロ =====
async function requestGyroPermission() {
  try {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        showNotification('ジャイロを許可してください');
      }
    }
  } catch (e) {
    console.error('gyro error', e);
  }
}


// ===== カメラ =====
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    video.srcObject = stream;

    video.addEventListener('loadedmetadata', () => {
      video.play();
    }, { once: true });

  } catch (e) {
    console.error('camera error', e);
    showNotification('カメラを起動できません');
  }
}

startButton.addEventListener('click', () => {

  startScreen.style.display = 'none';
  controlPanel.style.display = 'flex';

  // ジャイロ
  requestGyroPermission();

  // カメラ
  startCamera();

  // モデルロード
  ensureModelLoaded();
});


// 推論処理（predictボタン）
predictButton.addEventListener('click', async () => {
  /*
  const ok = await ensureModelLoaded();
  if (!ok) return;
  */

  if(!model) {
    showNotification('モデル準備中です');
    return;
  }
  
  isArActive = true; 

  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  // モードに応じて領域を決定
  let rawBounds = null;
  const mode = getCurrentMode();
  
  /*
  
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
  */
  
  if (!currentSelection) {
      showProgressIndicator(false);
      predictButton.disabled = false;
      showNotification("領域を選択してください。", true);
      return;
  }
   
  const sel_width = currentSelection.maxX - currentSelection.minX;
  const sel_height = currentSelection.maxY - currentSelection.minY;
  rawBounds = {
      minX: currentSelection.minX,
      minY: currentSelection.minY,
      maxX: currentSelection.maxX,
      maxY: currentSelection.maxY,
      width: sel_width,
      height: sel_height,
      centerX: (currentSelection.minX + currentSelection.maxX) / 2,
      centerY: (currentSelection.minY + currentSelection.maxY) / 2,
      area: sel_width * sel_height,
      aspectRatio: sel_width / sel_height
  };

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
  if (predictions.length === 0) {
    showProgressIndicator(false);
    showNotification("分類に必要な予測を取得できませんでした。後でもう一度お試しください。", true);
    predictButton.disabled = false;
    return;
  }

  // avgScores が数値で構成されていることを確認
  if (!avgScores.every(s => Number.isFinite(s))) {
    showProgressIndicator(false);
    console.warn('Invalid avgScores', avgScores);
    showNotification("分類に失敗しました（内部エラー）。", true);
    predictButton.disabled = false;
    return;
  }

  const maxAvgScore = Math.max(...avgScores);
  if (!Number.isFinite(maxAvgScore)) {
    showProgressIndicator(false);
    showNotification("分類に失敗しました（無効なスコア）。", true);
    predictButton.disabled = false;
    return;
  }

  const finalIndex = avgScores.indexOf(maxAvgScore);
  if (finalIndex < 0 || finalIndex >= classLabels.length) {
    showProgressIndicator(false);
    console.warn('finalIndex out of range', finalIndex, avgScores, classLabels.length);
    showNotification("分類結果が不正です。", true);
    predictButton.disabled = false;
    return;
  }

  const finalLabel = classLabels[finalIndex];
  let labelData = labelInfo[finalLabel];
  if (!labelData) {
    showProgressIndicator(false);
    console.warn('labelInfo missing for', finalLabel);
    showNotification("分類に失敗しました（不明なラベル）。", true);
    predictButton.disabled = false;
    return;
  }

  const confidence = maxAvgScore;

  if (identifiedObject) {
    identifiedObject.parentNode.removeChild(identifiedObject);
    identifiedObject = null;
  }

  const bubbleText = document.getElementById('bubbleText');

  // 信頼度チェック（閾値: 0.8）
  if (confidence >= 0.50) {
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
  if (!currentLocation) await getLocation();

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
  
  //一致枚数を計算 
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
    matchCount: matchCount,        // 追加
    totalSamples: totalSamples,    // 追加
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
