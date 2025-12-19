// NOTE: indiv.js は分割されました。主要機能は以下のファイルに移動しました:
// - assets/js/zukan_utils.js
// - assets/js/indiv/cards.js
// - assets/js/indiv/swipe.js
// - assets/js/indiv/main.js

console.log('indiv.js (legacy shim) loaded');

// -----------------------------------------------------------
// 図鑑カード表示機能
// -----------------------------------------------------------

// データ読み込み（デモデータなし）
function loadData() {
  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
}

// レア度は共通ユーティリティの getRarityStars(name) を使い、
// indiv では HTML 部分のみをテンプレートで参照する（例: getRarityStars(name).html）。


// 写真データのマッピング（共通ユーティリティを利用）
function getImagePath(name) {
  return window.getImagePath ? window.getImagePath(name) : '../assets/img/noimage.jpg';
}


// 住所取得は共通ユーティリティを利用
async function getAddressFromCoords(latitude, longitude) {
  return window.getAddressFromCoords ? window.getAddressFromCoords(latitude, longitude) : '位置情報あり';
}


// カード生成関数は分割済み: assets/js/indiv/cards.js を参照
// スワイプ関連のハンドラは分割済み: assets/js/indiv/swipe.js を参照
// -----------------------------------------------------------
// カードナビゲーション (グローバル関数として公開)
// -----------------------------------------------------------

// nextCard/prevCard は indiv/swipe.js に移動済み

// updateCardView は indiv/swipe.js に移動済み

// -----------------------------------------------------------
// 初期化処理（グローバル関数として公開 - hamburger_menu.jsから呼ばれる）
// -----------------------------------------------------------

// window.init is defined in indiv/main.js

  
  // 図鑑データカードの処理
  loadData();

  

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
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'">
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

// DOMContentLoaded handling moved to indiv/main.js
