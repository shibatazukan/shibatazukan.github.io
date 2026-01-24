// camera.dom_utils.js
// DOM 要素の取得とユーティリティ関数
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

// 追加 地球ベクトルに変換
function latLngToEarthUp(lat, lng) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;

  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
}

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