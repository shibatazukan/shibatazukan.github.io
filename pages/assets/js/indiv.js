// 図鑑カード表示・スワイプ機能に関連する変数
let zukanData = [];
let currentIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;

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
    '赤とんぼ': 2,
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
    'あやめ': '../assets/img/あやめ.jpg',
    'さくら': '../assets/img/さくら.jpg',
    'カブトムシ': '../assets/img/カブトムシ.jpg',
    'クワガタ': '../assets/img/クワガタ.jpg',
    '赤とんぼ': '../assets/img/赤とんぼ.jpg'
  };
 
  // 完全一致を試す
  if (imageMap[name]) {
    return imageMap[name];
  }
 
  // 部分一致を試す（赤とんぼなど）
  for (const [key, value] of Object.entries(imageMap)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }
 
  return null;
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
  console.log(`画像パス: ${imagePath} (名前: "${entry.name}")`);
  console.log(`利用可能な画像:`, Object.keys({
    'あやめ': '../assets/img/あやめ.jpg',
    'さくら': '../assets/img/さくら.jpg',
    'カブトムシ': '../assets/img/カブトムシ.jpg',
    'クワガタ': '../assets/img/クワガタ.jpg',
    '赤とんぼ': '../assets/img/赤とんぼ.jpg'
  }));
 
  // 写真がある場合は画像を表示、ない場合はデフォルト表示
  const imageContent = imagePath
    ? `<img src="${imagePath}" alt="${entry.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
       <div style="display: none; text-align: center; z-index: 1; position: relative;">
         <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
         <div>写真読み込みエラー</div>
       </div>`
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
  // 図鑑データカードの処理
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
// DOMContentLoadedイベント
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // 初期化実行（カードの読み込み）
  init();
});