// 背景画像
const images = ['../img/home_bg1.jpg', '../img/home_bg2.jpg', '../img/home_bg3.jpg'];
let currentIndex = 0;
const clearBg = document.getElementById('background-clear');
const blurBg = document.getElementById('background-blur');
const userNameDisplay = document.getElementById('userNameDisplay'); // 既存

// ユーザー設定を初期化
function init() {
  const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
    username: "ユーザー名",
    completedMissions: [],
    preferences: {}
  };
  if (userNameDisplay) 
{
    userNameDisplay.textContent = userSettings.username;
  }
}

// ユーザー名登録・保存
function registerUserName() {
  const currentName = userNameDisplay.textContent === 'ユーザー名' ? '' : userNameDisplay.textContent;
  const newUserName = prompt('新しいユーザー名を入力してください:', currentName);
  if (newUserName !== null && newUserName.trim() !== "") {
    const trimmedName = newUserName.trim();
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
    userSettings.username = trimmedName;
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    userNameDisplay.textContent = trimmedName;
    showNotification(`ユーザー名を「${trimmedName}」に更新しました！`);
  } else if (newUserName !== null) {
    showNotification('ユーザー名の変更をキャンセルしました。');
  }
}

// 通知
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.innerHTML = message.replace(/\n/g, '<br>');
  notification.className = 'notification show' + (isError ? ' error' : '');
  setTimeout(() => notification.classList.remove('show'), 3000);
}

// 背景更新
function updateBackground() {
  const nextIndex = (currentIndex + 1) % images.length;
  const nextImage = new Image();
  nextImage.src = images[nextIndex];
  nextImage.onload = () => {
    clearBg.style.backgroundImage = `url('${images[nextIndex]}')`;
    blurBg.style.backgroundImage = `url('${images[nextIndex]}')`;
    currentIndex = nextIndex;
  };
}

// 初期設定
clearBg.style.backgroundImage = `url('${images[currentIndex]}')`;
blurBg.style.backgroundImage = `url('${images[currentIndex]}')`;
setTimeout(() => {
  blurBg.style.opacity = '1';
  setTimeout(() => document.getElementById('overlay').classList.add('visible'), 350);
}, 500);
setInterval(updateBackground, 5000);

// イベント登録
document.getElementById('shareData').addEventListener('click', () => {
  showNotification('データ共有機能は準備中です');
});

document.getElementById('loadData').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    showNotification(`ファイル「${file.name}」を読み込みました`);
  }
  e.target.value = '';
});

const menuTitle = document.querySelector('.menu-title');
if (menuTitle) {
  menuTitle.addEventListener('click', (event) => {
    event.stopPropagation();
    registerUserName();
  });
}

document.addEventListener('DOMContentLoaded', init);
