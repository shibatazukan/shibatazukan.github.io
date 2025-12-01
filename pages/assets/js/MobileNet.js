let model;
let video;
let stream;
let isClassifying = false;
let lastTime = Date.now();
let frameCount = 0;

const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoContainer = document.getElementById('videoContainer');
const stats = document.getElementById('stats');
const predictionsDiv = document.getElementById('predictions');

async function loadModel() {
    try {
        status.textContent = 'モデルを読み込み中...';
        status.className = 'status info';
        
        // TensorFlow.jsの準備を待つ
        await tf.ready();
        
        // MobileNetモデルをロード（version: 1 = 軽量版）
        model = await mobilenet.load({
            version: 1,
            alpha: 0.25  // 最も軽量なモデル
        });
        
        status.textContent = '準備完了！分類を開始してください';
        status.className = 'status success';
        startBtn.disabled = false;
    } catch (error) {
        status.textContent = 'エラー: ' + error.message;
        status.className = 'status error';
        console.error('Model load error:', error);
    }
}

async function setupWebcam() {
    video = document.getElementById('videoElement');

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

async function startClassification() {
    try {
        await setupWebcam();
        
        videoContainer.style.display = 'block';
        stats.style.display = 'block';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        status.textContent = '分類中...';
        status.className = 'status success';
        
        isClassifying = true;
        lastTime = Date.now();
        frameCount = 0;
        
        classifyFrame();
    } catch (error) {
        console.error('Start classification error:', error);
    }
}

function stopClassification() {
    isClassifying = false;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    videoContainer.style.display = 'none';
    stats.style.display = 'none';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    status.textContent = '準備完了！分類を開始してください';
    status.className = 'status success';
}

async function classifyFrame() {
    if (!isClassifying) return;

    try {
        // MobileNetで上位5つの予測を取得
        const predictions = await model.classify(video, 5);
        
        displayPredictions(predictions);
        
        // FPS計算
        frameCount++;
        const currentTime = Date.now();
        if (currentTime - lastTime >= 1000) {
            document.getElementById('fps').textContent = frameCount;
            frameCount = 0;
            lastTime = currentTime;
        }
    } catch (error) {
        console.error('Classification error:', error);
    }
    
    requestAnimationFrame(classifyFrame);
}

function displayPredictions(predictions) {
    predictionsDiv.innerHTML = '';
    
    predictions.forEach((pred, index) => {
        const percentage = (pred.probability * 100).toFixed(1);
        const predDiv = document.createElement('div');
        predDiv.className = 'prediction';
        predDiv.innerHTML = `
            <span class="prediction-label">${index + 1}. ${pred.className}</span>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="prediction-value">${percentage}%</span>
        `;
        predictionsDiv.appendChild(predDiv);
    });
}

// イベントリスナー
startBtn.addEventListener('click', startClassification);
stopBtn.addEventListener('click', stopClassification);

// 初期化
loadModel();