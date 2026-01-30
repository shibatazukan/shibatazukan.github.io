// camera.model.js
// モデル読み込み、カメラセットアップ、分類・保存処理

let modelLoading = false;
let model = null;

// Teachable Machineライブラリを使ってモデルを読み込む
async function ensureModelLoaded() {
  if (model) return true;
  if (modelLoading) return false;

  modelLoading = true;

  try {
    // Teachable Machine Image ライブラリを使用
    const modelURL = modelPath.replace('/model.json', '/');
    const metadataURL = modelURL + 'metadata.json';
    
    model = await tmImage.load(modelURL + 'model.json', metadataURL);
    console.log('Teachable Machine model loaded');
    return true;

  } catch (e) {
    console.error('model load error', e);
    showNotification('モデルの読み込みに失敗しました', true);
    return false;

  } finally {
    modelLoading = false;
  }
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('位置情報がサポートされていません');
      currentLocation = null;
      resolve(null);
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
        resolve(currentLocation);
      },
      (error) => {
        console.warn('位置情報の取得に失敗:', error.message);
        showNotification('位置情報の取得に失敗しました', false, true);
        currentLocation = null;
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

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
  if (!model) {
    showNotification('モデル準備中です');
    return;
  }
  
  isArActive = true; 
  predictButton.disabled = true;
  saveButton.disabled = true;
  showProgressIndicator(true);

  // 領域の決定（currentSelectionを利用）
  if (!currentSelection) {
    showProgressIndicator(false);
    predictButton.disabled = false;
    showNotification("領域を選択してください。", true);
    return;
  }
   
  const sel_width = currentSelection.maxX - currentSelection.minX;
  const sel_height = currentSelection.maxY - currentSelection.minY;
  const rawBounds = {
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
    showNotification("有効な領域を選択してください。", true);
    return;
  }
  
  const { minX, minY, width, height } = bounds;

  // --- 推論処理（サンプリング） ---
  const predictions = [];
  const totalSamples = 10;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 224;
  tempCanvas.height = 224;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  for (let i = 0; i < totalSamples; i++) {
    updateProgress(i + 1, totalSamples);
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(video, minX, minY, width, height, 0, 0, 224, 224);

    // Teachable Machineライブラリを使用して予測
    const prediction = await model.predict(tempCanvas);
    
    // predictionは [{className: string, probability: number}] の形式
    // classLabels順に並べ替えてスコア配列を作成
    const scores = classLabels.map(label => {
      const found = prediction.find(p => p.className === label);
      return found ? found.probability : 0;
    });
    
    predictions.push(scores);

    await new Promise(resolve => setTimeout(resolve, 80));
  }

  showProgressIndicator(false);

  // --- 平均スコアの計算 ---
  const numClasses = classLabels.length;
  const avgScores = new Array(numClasses).fill(0);
  for (let i = 0; i < numClasses; i++) {
    let sum = 0;
    for (let j = 0; j < predictions.length; j++) {
      sum += predictions[j][i];
    }
    avgScores[i] = sum / predictions.length;
  }

  // --- 判定ロジック（マージン計算） ---
  const sorted = [...avgScores].sort((a, b) => b - a);
  const confidence = sorted[0]; // 1位のスコア
  const margin = numClasses > 1 ? sorted[0] - sorted[1] : sorted[0]; // 2位との差
  const finalIndex = avgScores.indexOf(confidence);

  // 安全チェック
  if (finalIndex === -1 || !classLabels[finalIndex]) {
    showNotification("分類に失敗しました。", true);
    predictButton.disabled = false;
    return;
  }

  const finalLabel = classLabels[finalIndex];
  const labelData = labelInfo[finalLabel];

  // --- 結果の表示判定（閾値チェック） ---
  const MIN_CONFIDENCE = 0.5;
  const MIN_MARGIN = 0.20;

  const camera = document.querySelector('#mainCamera');
  const bubble = document.getElementById('infoBubble');
  const bubbleTextEl = document.getElementById('bubbleText');

  if (confidence >= MIN_CONFIDENCE && margin >= MIN_MARGIN && labelData) {
    // 成功：詳細情報を表示
    const confidencePercent = (confidence * 100).toFixed(1);
    const template = `なまえ：${labelData.name}\n種類　：${labelData.category}\n説明　：${labelData.description}\n\n信頼度：${confidencePercent}%`;
    
    bubbleTextEl.setAttribute('value', template);
    saveButton.disabled = false;
    lastPrediction = { label: finalLabel, confidence, avgScores };
  } else {
    // 失敗（または確信が低い）：警告を表示
    bubbleTextEl.setAttribute('value', `分類できませんでした。\n別の角度から試してください。\n\n最高信頼度: ${(confidence * 100).toFixed(1)}%`);
    saveButton.disabled = true;
  }

  // ARバブルの位置調整
  if (camera && camera.object3D) {
    const cameraWorldPosition = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraWorldPosition);
    const infoBubblePosition = new THREE.Vector3(0, 0, -2);
    infoBubblePosition.applyQuaternion(camera.object3D.quaternion);
    infoBubblePosition.add(cameraWorldPosition);
    
    bubble.setAttribute('position', infoBubblePosition);
    bubble.setAttribute('visible', true);
  }

  // 後片付け
  const currentMode = getCurrentMode();
  if (currentMode === 'freehand') points = [];
  if (currentMode === 'rectangle') currentSelection = null;
  clearCanvas();
  predictButton.disabled = false;
});

saveButton.addEventListener('click', async () => {
  if (!lastPrediction) return;
  if (!currentLocation) {
    await getLocation();
  }

  saveButton.disabled = true;
  showNotification('登録中...', false, false);

  const { label, confidence, avgScores } = lastPrediction;
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
  
  const totalSamples = 10;
  const classIndex = classLabels.indexOf(label);
  let matchCount = Math.round(confidence * totalSamples);
  
  const entry = {
    name: labelData.name,
    category: labelData.category,
    description: labelData.description,
    date: now,
    confidence: confidence,
    matchCount: matchCount,
    totalSamples: totalSamples,
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
