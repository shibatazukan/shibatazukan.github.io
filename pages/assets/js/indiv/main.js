// indiv メイン: データ読み込みと初期化
let zukanData = [];
let currentIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;

// データ読み込み（デモデータなし）
function loadData() {
  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
}

// 初期化（グローバル関数として公開 - hamburger_menu.jsから呼ばれる）
window.init = function() {
  console.log('init() called - Loading zukan data...');
  
  // 図鑑データカードの処理
  loadData();

  const container = document.getElementById('cardContainer');
  if (!container) {
    console.error('cardContainer not found!');
    return;
  }

  container.innerHTML = '';

  const emptyState = document.getElementById('emptyState');
  const navigation = document.getElementById('navigation');
  const counter = document.getElementById('counter');

  if (zukanData.length === 0) {
    console.log('No zukan data found');
    if (emptyState) {
      emptyState.style.display = 'block';
      // 「見つけに行こう！」ボタンを追加
      emptyState.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
          <p style="font-size: 18px; color: #666; margin-bottom: 30px;">まだ図鑑に登録されていません</p>
          <button onclick="location.href='../camera/index.html'" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'>
            🔍 見つけに行こう！
          </button>
        </div>
      `;
    }
    if (navigation) navigation.style.display = 'none';
    if (counter) counter.style.display = 'none';
    return;
  }

  console.log(`Loading ${zukanData.length} cards...`);
  if (emptyState) emptyState.style.display = 'none';

  // カードを全て生成（同期的に生成して即座に表示）
  for (let index = 0; index < zukanData.length; index++) {
    const card = createCard(zukanData[index], index);
    container.appendChild(card);
  }

  // 最新のカードを初期表示
  currentIndex = zukanData.length - 1;
  updateCardView();
  if (navigation) navigation.style.display = 'flex';
  if (counter) counter.style.display = 'block';
  
  console.log('Cards loaded successfully');
}

// DOMContentLoadedイベント
document.addEventListener('DOMContentLoaded', () => {
  console.log('indiv split: DOMContentLoaded');
  // 初期化実行（カードの読み込み）
  init();
});