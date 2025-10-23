// 図鑑カード表示・スワイプ機能に関連する変数
let zukanData = [];
let currentIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;

const userNameDisplay = document.getElementById('userNameDisplay');

// -----------------------------------------------------------
// 通知表示関数
// -----------------------------------------------------------
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  if (!notification) {
    console.log(`[通知] ${isError ? 'ERROR: ' : ''}${message.replace(/\n/g, ' ')}`);
    return;
  }
  notification.innerHTML = message.replace(/\n/g, '<br>');
  notification.className = 'notification show' + (isError ? ' error' : '');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// -----------------------------------------------------------
// ユーザー設定の初期化/更新関数
// -----------------------------------------------------------
function initSettings() {
  const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
    username: "ユーザー名",
    completedMissions: [],
    preferences: {}
  };
  if (userNameDisplay) {
    userNameDisplay.textContent = userSettings.username;
  }
}

// -----------------------------------------------------------
// ユーザー名を登録・保存する関数
// -----------------------------------------------------------
function registerUserName() {
  if (!userNameDisplay) return;

  const currentName = userNameDisplay.textContent === 'ユーザー名'
    ? ''
    : userNameDisplay.textContent;

  const newUserName = prompt('新しいユーザー名を入力してください:', currentName);

  if (newUserName !== null && newUserName.trim() !== "") {
    const trimmedName = newUserName.trim();

    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
      username: "ユーザー名",
      completedMissions: [],
      preferences: {}
    };
    userSettings.username = trimmedName;
    localStorage.setItem('userSettings', JSON.stringify(userSettings));

    userNameDisplay.textContent = trimmedName;

    showNotification(`ユーザー名を「${trimmedName}」に更新しました！`);
  } else if (newUserName !== null) {
    showNotification('ユーザー名の変更をキャンセルしました。');
  }
}

// -----------------------------------------------------------
// データ共有・保存機能
// -----------------------------------------------------------

// 図鑑データ取得
function getZukanData() {
  try {
    const zukanArray = JSON.parse(localStorage.getItem('myZukan')) || [];
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
      username: "ユーザー名",
      completedMissions: [],
      preferences: {}
    };
    const uniqueNames = new Set(zukanArray.map(item => item.name));
    const categories = zukanArray.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    return {
      version: "1.0",
      exportDate: new Date().toISOString(),
      appName: "新発田ずかん",
      discoveries: zukanArray.map(item => ({
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        category: item.category,
        description: item.description,
        date: item.date,
        matchCount: item.matchCount || 0,
        totalSamples: item.totalSamples || 30,
        accuracy: Math.round(((item.matchCount || 0) / (item.totalSamples || 30)) * 100),
        discoveredAt: item.date
      })),
      settings: userSettings,
      statistics: {
        totalDiscoveries: zukanArray.length,
        uniqueSpecies: uniqueNames.size,
        categories: categories,
        averageAccuracy: zukanArray.length > 0 ?
          Math.round(zukanArray.reduce((sum, item) =>
            sum + ((item.matchCount || 0) / (item.totalSamples || 30) * 100), 0
          ) / zukanArray.length) : 0
      }
    };
  } catch (error) {
    console.error('データ取得エラー:', error);
    return {
      version: "1.0",
      exportDate: new Date().toISOString(),
      appName: "新発田ずかん",
      discoveries: [],
      settings: { username: "ユーザー名", completedMissions: [], preferences: {} },
      statistics: { totalDiscoveries: 0, uniqueSpecies: 0, categories: {}, averageAccuracy: 0 }
    };
  }
}

// クリップボード失敗時のフォールバック
function fallbackCopyMethod(text, stats) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showNotification(`データをクリップボードにコピーしました！（発見数: ${stats.totalDiscoveries}件）メモアプリなどに貼り付けて保存してください`);
  } catch (err) {
    textArea.style.position = 'fixed';
    textArea.style.top = '50px';
    textArea.style.left = '50px';
    textArea.style.width = '80%';
    textArea.style.height = '80%';
    textArea.style.zIndex = '10000';
    textArea.style.background = 'white';
    textArea.style.color = 'black';
    textArea.style.border = '2px solid #333';
    textArea.style.padding = '10px';
    showNotification('データを表示しました。全選択してコピーし、メモアプリに保存してください。画面外をタップすると閉じます。');
    const closeHandler = (e) => {
      if (e.target !== textArea) {
        document.body.removeChild(textArea);
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 500);
    return;
  }
  document.body.removeChild(textArea);
}

// 共有機能
function shareZukanData() {
  try {
    const zukanData = getZukanData();
    const dataStr = JSON.stringify(zukanData, null, 2);
    const fileName = `shibata-zukan-data-${new Date().toISOString().split('T')[0]}.json`;
    
    // Web Share API
    if (navigator.share && navigator.canShare) {
      const file = new File([dataStr], fileName, {
        type: 'application/json',
      });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: '新発田ずかんデータ',
          text: `図鑑データ（${zukanData.statistics.totalDiscoveries}件の発見）をバックアップしました`
        }).then(() => {
          showNotification('データを他アプリやファイルに保存できます！');
        }).catch((error) => {
          console.log('共有がキャンセルされました:', error);
        });
        return;
      }
    }
    
    // Web Share API非対応 → クリップボード
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dataStr).then(() => {
        const stats = zukanData.statistics;
        showNotification(`データをクリップボードにコピーしました！（発見数: ${stats.totalDiscoveries}件）メモアプリなどに貼り付けて保存してください`);
      }).catch(() => {
        fallbackCopyMethod(dataStr, zukanData.statistics);
      });
    } else {
      fallbackCopyMethod(dataStr, zukanData.statistics);
    }
  } catch (error) {
    console.error('共有エラー:', error);
    showNotification('データの共有に失敗しました', true);
  }
}

// ロード機能
function loadZukanData(file) {
  if (!file) {
    showNotification('ファイルが選択されていません', true);
    return;
  }
  
  if (!file.name.endsWith('.json')) {
    showNotification('JSONファイルを選択してください', true);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error('バージョン情報が見つかりません');
      if (!data.discoveries || !Array.isArray(data.discoveries)) throw new Error('発見データが正しい形式ではありません');
      
      const currentData = JSON.parse(localStorage.getItem('myZukan')) || [];
      const importData = data.discoveries.map(item => ({
        name: item.name,
        category: item.category,
        description: item.description,
        date: item.date || item.discoveredAt || new Date().toISOString(),
        matchCount: item.matchCount || 0,
        totalSamples: item.totalSamples || 30,
        id: item.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      const existingKeys = new Set(currentData.map(item => `${item.name}-${item.date}`));
      const newItems = importData.filter(item =>
        !existingKeys.has(`${item.name}-${item.date}`)
      );
      
      const mergedData = [...currentData, ...newItems];
      localStorage.setItem('myZukan', JSON.stringify(mergedData));
      
      if (data.settings) {
        const currentSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        const mergedSettings = { ...currentSettings, ...data.settings };
        localStorage.setItem('userSettings', JSON.stringify(mergedSettings));
      }
      
      const totalImported = data.discoveries.length;
      const newDiscoveries = newItems.length;
      const duplicates = totalImported - newDiscoveries;
      
      let message = `データをロードしました！\n`;
      message += `- 新規追加: ${newDiscoveries}件\n`;
      if (duplicates > 0) {
        message += `- 重複スキップ: ${duplicates}件\n`;
      }
      message += `- 現在の総発見数: ${mergedData.length}件`;
      
      showNotification(message);
      
      // データをリロードして表示を更新
      setTimeout(() => {
        init();
      }, 1000);
    } catch (error) {
      console.error('ロードエラー:', error);
      showNotification(`ファイルの読み込みに失敗しました: ${error.message}`, true);
    }
  };
  
  reader.onerror = function () {
    showNotification('ファイルの読み込みに失敗しました', true);
  };
  
  reader.readAsText(file);
}

// -----------------------------------------------------------
// 図鑑カード表示機能
// -----------------------------------------------------------

// データ読み込み（デモデータなし）
function loadData() {
  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
}

// レア度を星で表示
function getRarityStars(name) {
  const rarityMap = {
    'あやめ': 3,
    'さくら': 4,
    'とんぼ': 2,
    'カブトムシ': 4,
    'クワガタ': 5
  };

  const rarity = rarityMap[name] || 3;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= rarity ? '' : 'empty'}">★</span>`;
  }
  return stars;
}

// 写真データのマッピング
function getImagePath(name) {
  const imageMap = {
    'あやめ': '../img/あやめ.jpg',
    'さくら': '../img/さくら.jpg',
    'カブトムシ': '../img/カブトムシ.jpg',
    'クワガタ': '../img/クワガタ.jpg',
    '赤とんぼ': '../img/赤とんぼ.jpg'
  };
  
  return imageMap[name] || null;
}

// カード作成
function createCard(entry, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.zIndex = zukanData.length - index;

  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('ja-JP');

  // 写真のパスを取得
  const imagePath = getImagePath(entry.name);
  
  // 写真がある場合は画像を表示、ない場合はデフォルト表示
  const imageContent = imagePath 
    ? `<img src="${imagePath}" alt="${entry.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`
    : `<div style="text-align: center; z-index: 1; position: relative;">
         <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
         <div>写真データなし</div>
       </div>`;

  card.innerHTML = `
    <div class="card-title">${entry.name}</div>
    <div class="rarity">${getRarityStars(entry.name)}</div>
    <div class="card-image">
      ${imageContent}
    </div>
    <div class="card-description">
      <div style="margin-bottom: 8px;"><strong>これは${entry.name}です。</strong></div>
      <div style="margin-bottom: 8px;"><strong>種類:</strong> ${entry.category}</div>
      <div style="margin-bottom: 8px;"><strong>特徴:</strong> ${entry.description}</div>
      <div style="margin-bottom: 8px;"><strong>一致度:</strong> ${entry.matchCount || 0}/${entry.totalSamples || 30}回</div>
    </div>
    <div class="card-meta">発見日: ${dateStr}</div>
  `;

  // タッチイベント
  card.addEventListener('touchstart', handleTouchStart, { passive: false });
  card.addEventListener('touchmove', handleTouchMove, { passive: false });
  card.addEventListener('touchend', handleTouchEnd);

  // マウスイベント
  card.addEventListener('mousedown', handleMouseDown);
  card.addEventListener('mousemove', handleMouseMove);
  card.addEventListener('mouseup', handleMouseUp);
  card.addEventListener('mouseleave', handleMouseUp);

  return card;
}

// -----------------------------------------------------------
// タッチ/マウスイベント処理 (スワイプ)
// -----------------------------------------------------------

function handleTouchStart(e) {
  if (e.target.closest('.card') !== getTopCard()) return;
  startX = e.touches[0].clientX;
  isDragging = true;
  e.target.closest('.card').classList.add('swiping');
}

function handleMouseDown(e) {
  if (e.target.closest('.card') !== getTopCard()) return;
  startX = e.clientX;
  isDragging = true;
  e.target.closest('.card').classList.add('swiping');
  e.preventDefault();
}

function handleTouchMove(e) {
  if (!isDragging || e.target.closest('.card') !== getTopCard()) return;
  currentX = e.touches[0].clientX - startX;
  updateCardPosition(e.target.closest('.card'), currentX);
  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isDragging || e.target.closest('.card') !== getTopCard()) return;
  currentX = e.clientX - startX;
  updateCardPosition(e.target.closest('.card'), currentX);
}

function handleTouchEnd(e) {
  handleEnd(e.target.closest('.card'));
}

function handleMouseUp(e) {
  const cardElement = e.target.closest('.card');
  if (cardElement) {
    handleEnd(cardElement);
  }
}

function handleEnd(card) {
  if (!isDragging || card !== getTopCard()) {
    if (card) {
      card.classList.remove('swiping');
    }
    return;
  }

  isDragging = false;
  card.classList.remove('swiping');

  if (Math.abs(currentX) > 100) {
    if (currentX > 0) {
      prevCard(); // 右スワイプで前のカード
    } else {
      nextCard(); // 左スワイプで次のカード
    }
  } else {
    // 100px未満の移動なら元に戻す
    card.style.transform = 'translateX(0)';
  }
  currentX = 0;
}

function updateCardPosition(card, x) {
  card.style.transform = `translateX(${x}px) rotate(${x * 0.1}deg)`;
}

function getTopCard() {
  const cards = document.querySelectorAll('.card');
  return cards[zukanData.length - 1 - currentIndex];
}

// -----------------------------------------------------------
// カードナビゲーション (グローバル関数として公開)
// -----------------------------------------------------------

window.nextCard = function () {
  if (currentIndex < zukanData.length - 1) {
    currentIndex++;
    updateCardView();
  }
}

window.prevCard = function () {
  if (currentIndex > 0) {
    currentIndex--;
    updateCardView();
  }
}

function updateCardView() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    const cardIndex = zukanData.length - 1 - index;
    if (cardIndex === currentIndex) {
      // 現在表示中のカード
      card.style.transform = 'translateX(0) scale(1)';
      card.style.opacity = '1';
      card.style.zIndex = '10';
    } else if (cardIndex < currentIndex) {
      // 過去のカード（左にスワイプ済み）
      card.style.transform = 'translateX(-100%) scale(0.9)';
      card.style.opacity = '0';
      card.style.zIndex = '1';
    } else {
      // 未来のカード（右にスワイプ待ち）
      card.style.transform = 'translateX(100%) scale(0.9)';
      card.style.opacity = '0';
      card.style.zIndex = '1';
    }
  });

  // ボタン状態更新
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === zukanData.length - 1;

  // カウンター更新
  const counter = document.getElementById('counter');
  if (counter) counter.textContent = `${currentIndex + 1} / ${zukanData.length}`;
}

// -----------------------------------------------------------
// 初期化処理
// -----------------------------------------------------------

function init() {
  // 1. 設定の初期化（ユーザー名の読み込み・表示）
  initSettings();

  // 2. 図鑑データカードの処理
  loadData();

  const container = document.getElementById('cardContainer');
  if (!container) return;

  container.innerHTML = '';

  const emptyState = document.getElementById('emptyState');
  const navigation = document.getElementById('navigation');
  const counter = document.getElementById('counter');

  if (zukanData.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
      // 「見つけに行こう！」ボタンを追加
      emptyState.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
          <p style="font-size: 18px; color: #666; margin-bottom: 30px;">まだ図鑑に登録されていません</p>
          <button onclick="location.href='../camera/camera.html'" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'">
            🚀 見つけに行こう！
          </button>
        </div>
      `;
    }
    if (navigation) navigation.style.display = 'none';
    if (counter) counter.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // カードを全て生成
  zukanData.forEach((entry, index) => {
    const card = createCard(entry, index);
    container.appendChild(card);
  });

  // 最新のカードを初期表示
  currentIndex = zukanData.length - 1;
  updateCardView();
  if (navigation) navigation.style.display = 'flex';
  if (counter) counter.style.display = 'block';
}

// -----------------------------------------------------------
// イベントリスナーの設定
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // 初期化実行 (ユーザー名、カードの読み込み)
  init();

  // メニュー開閉
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  if (menuToggle && sideMenu) {
    menuToggle.addEventListener('click', () => {
      sideMenu.classList.toggle('open');
    });
  }

  // ユーザー名表示部分にクリックイベントリスナーを設定
  const menuTitle = document.querySelector('.menu-title');
  if (menuTitle) {
    menuTitle.addEventListener('click', (event) => {
      event.stopPropagation(); // メニュー開閉と干渉防止
      registerUserName();      // promptを直接呼ぶ
    });
  }

  // 「共有/ファイルに保存」ボタン
  const shareDataBtn = document.getElementById('shareData');
  if (shareDataBtn) {
    shareDataBtn.addEventListener('click', () => {
      showNotification('「ファイルに保存」や他アプリでバックアップできます（推奨）', false);
      shareZukanData();
    });
  }

  // データロード
  const loadDataBtn = document.getElementById('loadData');
  const fileInput = document.getElementById('fileInput');
  if (loadDataBtn && fileInput) {
    loadDataBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        loadZukanData(file);
      }
      // ファイル選択をリセット
      e.target.value = '';
    });
  }
});