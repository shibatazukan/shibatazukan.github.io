// list メイン: データ読み込み・フィルタ・統計表示
let zukanData = [];
let filteredData = [];

// データ読み込み（デモデータなし）
function loadData() {
  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
  filteredData = [...zukanData];
}

// 統計情報を計算・表示
function updateStats() {
  if (zukanData.length === 0) return;

  const totalCountEl = document.getElementById('totalCount');
  const uniqueCountEl = document.getElementById('uniqueCount');
  const avgAccuracyEl = document.getElementById('avgAccuracy');
  const recentCountEl = document.getElementById('recentCount');

  if (totalCountEl) totalCountEl.textContent = zukanData.length;

  const uniqueNames = new Set(zukanData.map(item => item.name));
  if (uniqueCountEl) uniqueCountEl.textContent = uniqueNames.size;

  const totalAccuracy = zukanData.reduce((sum, item) => {
    const accuracy = (item.matchCount || 0) / (item.totalSamples || 30) * 100;
    return sum + accuracy;
  }, 0);
  const avgAccuracy = Math.round(totalAccuracy / zukanData.length);
  if (avgAccuracyEl) avgAccuracyEl.textContent = avgAccuracy + '%';

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCount = zukanData.filter(item => {
    return new Date(item.date) > oneWeekAgo;
  }).length;
  if (recentCountEl) recentCountEl.textContent = recentCount;
}

// カテゴリフィルターのオプションを設定
function setupFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
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
  const categoryFilterEl = document.getElementById('categoryFilter');
  const sortByEl = document.getElementById('sortBy');
  const searchInputEl = document.getElementById('searchInput');

  const categoryFilter = categoryFilterEl ? categoryFilterEl.value : 'all';
  const sortBy = sortByEl ? sortByEl.value : 'date-desc';
  const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';

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

// 初期化（グローバル関数として公開 - hamburger_menu.jsから呼ばれる可能性がある）
window.init = function () {
  console.log('list.js: init() called');
  
  loadData();

  if (zukanData.length === 0) {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'block';
    // 「見つけに行こう！」ボタンを追加
    if (emptyState) {
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
    const statsEl = document.getElementById('stats'); if (statsEl) statsEl.style.display = 'none';
    const controlsEl = document.getElementById('controls'); if (controlsEl) controlsEl.style.display = 'none';
    return;
  }

  const emptyStateEl = document.getElementById('emptyState'); if (emptyStateEl) emptyStateEl.style.display = 'none';
  const statsEl = document.getElementById('stats'); if (statsEl) statsEl.style.display = 'grid';
  const controlsEl = document.getElementById('controls'); if (controlsEl) controlsEl.style.display = 'flex';

  updateStats();
  setupFilters();
  applyFilters();
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  console.log('list.js: DOMContentLoaded');
  init();
});