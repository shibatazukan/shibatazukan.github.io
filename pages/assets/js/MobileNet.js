let model;
let video;
let canvas;
let ctx;
let stream;
let isDetecting = false;
let detectionCount = 0;
let lastTime = Date.now();
let frameCount = 0;

const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoContainer = document.getElementById('videoContainer');
const stats = document.getElementById('stats');

async function loadModel() {
    try {
        status.textContent = 'モデルを読み込み中...';
        status.className = 'status info';
        
        model = await cocoSsd.load();
        
        status.textContent = '準備完了！検出を開始してください';
        status.className = 'status success';
        startBtn.disabled = false;
    } catch (error) {
        status.textContent = 'エラー: モデルの読み込みに失敗しました';
        status.className = 'status error';
        console.error('Model load error:', error);
    }
}

async function setupWebcam() {
    video = document.getElementById('videoElement');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                resolve();
            };
        });
    } catch (error) {
        status.textContent = 'カメラへのアクセスに失敗しました';
        status.className = 'status error';
        console.error('Camera error:', error);
        throw error;
    }
}

async function startDetection() {
    try {
        await setupWebcam();
        
        videoContainer.style.display = 'block';
        stats.style.display = 'block';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        status.textContent = '検出中...';
        status.className = 'status success';
        
        isDetecting = true;
        detectionCount = 0;
        lastTime = Date.now();
        frameCount = 0;
        
        detectObjects();
    } catch (error) {
        console.error('Start detection error:', error);
    }
}

function stopDetection() {
    isDetecting = false;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    videoContainer.style.display = 'none';
    stats.style.display = 'none';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    status.textContent = '準備完了！検出を開始してください';
    status.className = 'status success';
}

async function detectObjects() {
    if (!isDetecting) return;

    const predictions = await model.detect(video);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detectionCount = predictions.length;
    document.getElementById('detectionCount').textContent = detectionCount;
    
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const score = (prediction.score * 100).toFixed(1);
        
        // 枠を描画
        ctx.strokeStyle = '#0F0';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // ラベル背景
        ctx.fillStyle = '#0F0';
        const label = `${prediction.class} ${score}%`;
        ctx.font = '16px sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        // ラベルテキスト
        ctx.fillStyle = '#000';
        ctx.fillText(label, x + 5, y - 7);
    });
    
    // FPS計算
    frameCount++;
    const currentTime = Date.now();
    if (currentTime - lastTime >= 1000) {
        document.getElementById('fps').textContent = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(detectObjects);
}

// イベントリスナー
startBtn.addEventListener('click', startDetection);
stopBtn.addEventListener('click', stopDetection);

// 初期化
loadModel();