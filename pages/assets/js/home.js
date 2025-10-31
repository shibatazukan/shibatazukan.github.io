// ========================================
// 1. 背景画像設定と変数
// ========================================
const images = ['../assets/img/home_bg1.jpg', '../assets/img/home_bg2.jpg', '../assets/img/home_bg3.jpg'];
let currentIndex = 0;
const clearBg = document.getElementById('background-clear');
const blurBg = document.getElementById('background-blur');

// ========================================
// 2. 通知表示関数 (残す: エラーやデバッグのため、汎用的な通知機能は残しておくことが多いため)
// ========================================
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.innerHTML = message.replace(/\n/g, '<br>');
    notification.className = 'notification show' + (isError ? ' error' : '');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ========================================
// 3. 背景更新
// ========================================
function updateBackground() {
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = new Image();
    nextImage.src = images[nextIndex];
    nextImage.onload = () => {
        if (clearBg) clearBg.style.backgroundImage = `url('${images[nextIndex]}')`;
        if (blurBg) blurBg.style.backgroundImage = `url('${images[nextIndex]}')`;
        currentIndex = nextIndex;
    };
}

// ========================================
// 4. 初期化（背景設定とユーザー名初期表示）
// ========================================
function init() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    // ユーザー名を読み込み表示 (背景以外の唯一の初期化処理)
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
        username: "ユーザー名",
        completedMissions: [],
        preferences: {}
    };
    if (userNameDisplay) {
        userNameDisplay.textContent = userSettings.username;
    }
    
    // 背景の初期設定とアニメーション開始
    if (clearBg && blurBg) {
        clearBg.style.backgroundImage = `url('${images[currentIndex]}')`;
        blurBg.style.backgroundImage = `url('${images[currentIndex]}')`;
        setTimeout(() => {
            blurBg.style.opacity = '1';
            const overlay = document.getElementById('overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.classList.add('visible');
                }, 350);
            }
        }, 500);
    }

    // 背景の自動切り替え
    setInterval(updateBackground, 5000);
}

// ========================================
// 5. 初期化実行
// ========================================
document.addEventListener('DOMContentLoaded', init);