// list.js (DEPRECATED shim)
console.warn('[DEPRECATED] list.js split into list/main.js and list/render.js. Loading the new modules.');
(function(){
  var s1 = document.createElement('script');
  s1.src = './list/render.js';
  s1.async = false;
  document.currentScript.parentNode.insertBefore(s1, document.currentScript.nextSibling);
  var s2 = document.createElement('script');
  s2.src = './list/main.js';
  s2.async = false;
  document.currentScript.parentNode.insertBefore(s2, s1.nextSibling);
})();

// データ読み込み（デモデータなし）
function loadData() {
  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
  filteredData = [...zukanData];
}

// レア度は共通ユーティリティを利用
function getRarityStars(name) {
  return window.getRarityStars ? window.getRarityStars(name) : { html: '', value: 3 };
}

// 統計情報を計算・表示
function updateStats() {
  if (zukanData.length === 0) return;

  document.getElementById('totalCount').textContent = zukanData.length;

  const uniqueNames = new Set(zukanData.map(item => item.name));
  document.getElementById('uniqueCount').textContent = uniqueNames.size;

  const totalAccuracy = zukanData.reduce((sum, item) => {
    const accuracy = (item.matchCount || 0) / (item.totalSamples || 30) * 100;
    return sum + accuracy;
  }, 0);
  const avgAccuracy = Math.round(totalAccuracy / zukanData.length);
  document.getElementById('avgAccuracy').textContent = avgAccuracy + '%';

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCount = zukanData.filter(item => {
    return new Date(item.date) > oneWeekAgo;
  }).length;
  document.getElementById('recentCount').textContent = recentCount;
}

// カテゴリフィルターのオプションを設定
function setupFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = new Set(zukanData.map(item => item.category));

  while (categoryFilter.children.length > 1) {
    categoryFilter.removeChild(categoryFilter.lastChild);
  }

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// フィルター・ソートを適用
window.applyFilters = function () {
  const categoryFilter = document.getElementById('categoryFilter').value;
  const sortBy = document.getElementById('sortBy').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredData = zukanData.filter(item => {
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm);
    return matchCategory && matchSearch;
  });

  filteredData.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'name-asc':
        return a.name.localeCompare(b.name, 'ja');
      case 'accuracy-desc':
        const aAccuracy = (a.matchCount || 0) / (a.totalSamples || 30);
        const bAccuracy = (b.matchCount || 0) / (b.totalSamples || 30);
        return bAccuracy - aAccuracy;
      case 'rarity-desc':
        const aRarity = getRarityStars(a.name).value;
        const bRarity = getRarityStars(b.name).value;
        return bRarity - aRarity;
      default:
        return 0;
    }
  });

  renderListView();
}

// 住所取得は共通ユーティリティを利用
async function getAddressFromCoords(latitude, longitude) {
  return window.getAddressFromCoords ? window.getAddressFromCoords(latitude, longitude) : '位置情報あり';
}

// 一覧ビューを描画
function renderListView() {
  const container = document.getElementById('listView');
  container.innerHTML = '';

  filteredData.forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = 'list-card';

    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rarity = getRarityStars(entry.name);
    const accuracy = Math.round((entry.matchCount || 0) / (entry.totalSamples || 30) * 100);

    // 位置情報がある場合は住所を表示（保存済みの住所を使用）
    let locationHTML = '';
    if (entry.location && entry.location.latitude && entry.location.longitude) {
      const address = entry.location.address || '位置情報あり';
      locationHTML = `
        <div class="info location-info">
          <span class="label">📍 発見場所:</span> 
          <span class="location-text">${address}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="list-card-header">
        <div>
          <h3>${entry.name}</h3>
          <div class="rarity">${rarity.html}</div>
        </div>
        <div class="category-tag">${entry.category}</div>
      </div>
      
      <div class="info">
        <span class="label">特徴:</span> ${entry.description}
      </div>
      
      <div class="info">
        <span class="label">一致度:</span> ${entry.matchCount || 0}/${entry.totalSamples || 10}回 (${accuracy}%)
        <div class="accuracy-bar">
          <div class="accuracy-fill" style="width: ${accuracy}%"></div>
        </div>
      </div>
      
      ${locationHTML}
      
      <div class="date-badge">📅 ${dateStr}</div>
    `;

    container.appendChild(card);
  });
}

// 初期化（グローバル関数として公開 - hamburger_menu.jsから呼ばれる可能性がある）
window.init = function () {
  console.log('list.js: init() called');
  
  loadData();

  if (zukanData.length === 0) {
    const emptyState = document.getElementById('emptyState');
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
    document.getElementById('stats').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('stats').style.display = 'grid';
  document.getElementById('controls').style.display = 'flex';

  updateStats();
  setupFilters();
  applyFilters();
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  console.log('list.js: DOMContentLoaded');
  init();
});
