let zukanData = [];
let filteredData = [];

// データ読み込み
function loadData() {
  // localStorageからデータを読み込み。存在しない場合はデモデータを設定。
  const demoData = [
    {
      name: 'オナガガモ',
      category: '鳥類',
      description: '特徴的な長い尾羽を持つカモ。冬の間に日本に飛来する。',
      date: new Date().toISOString(),
      matchCount: 28,
      totalSamples: 30
    },
    {
      name: 'キンクロハジロ',
      category: '鳥類',
      description: '頭の後ろから垂れ下がる冠羽と、黄色い瞳が特徴の潜水ガモ。',
      date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3日前
      matchCount: 30,
      totalSamples: 30
    },
    {
      name: 'コハクチョウ',
      category: '鳥類',
      description: '白い羽毛と優雅な姿を持つ大型の鳥。シベリアから渡来する。',
      date: new Date(Date.now() - 86400000 * 7).toISOString(), // 7日前
      matchCount: 25,
      totalSamples: 30
    },
    {
      name: 'アオムシ',
      category: '昆虫',
      description: '小さな体に緑色の体色を持つ、チョウやガの幼虫の総称。',
      date: new Date(Date.now() - 86400000 * 15).toISOString(),
      matchCount: 15,
      totalSamples: 30
    },
    {
      name: 'トノサマガエル',
      category: '両生類',
      description: '水田や湿地に生息する比較的大型のカエル。体色は緑色や褐色。',
      date: new Date(Date.now() - 86400000 * 1).toISOString(), // 昨日
      matchCount: 20,
      totalSamples: 30
    },
  ];

  if (!localStorage.getItem('myZukan')) {
    localStorage.setItem('myZukan', JSON.stringify(demoData));
  }

  zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
  filteredData = [...zukanData];
}

// レア度を星で表示
function getRarityStars(name) {
  const rarityMap = {
    'オナガガモ': 3,
    'キンクロハジロ': 3,
    'コハクチョウ': 4,
    'アオムシ': 2,
    'トノサマガエル': 3
  };

  const rarity = rarityMap[name] || 3;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= rarity ? '' : 'empty'}">★</span>`;
  }
  return { html: stars, value: rarity };
}

// 統計情報を計算・表示
function updateStats() {
  if (zukanData.length === 0) return;

  // 登録総数
  document.getElementById('totalCount').textContent = zukanData.length;

  // 発見種類（ユニーク）
  const uniqueNames = new Set(zukanData.map(item => item.name));
  document.getElementById('uniqueCount').textContent = uniqueNames.size;

  // 平均一致度
  const totalAccuracy = zukanData.reduce((sum, item) => {
    const accuracy = (item.matchCount || 0) / (item.totalSamples || 30) * 100;
    return sum + accuracy;
  }, 0);
  const avgAccuracy = Math.round(totalAccuracy / zukanData.length);
  document.getElementById('avgAccuracy').textContent = avgAccuracy + '%';

  // 今週の発見
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

  // 既存のオプションをクリア（「すべて」以外）
  while (categoryFilter.children.length > 1) {
    categoryFilter.removeChild(categoryFilter.lastChild);
  }

  // カテゴリオプションを追加
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// フィルター・ソートを適用
window.applyFilters = function () { // HTMLから呼び出されるためwindowに公開
  const categoryFilter = document.getElementById('categoryFilter').value;
  const sortBy = document.getElementById('sortBy').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  // フィルタリング
  filteredData = zukanData.filter(item => {
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm);
    return matchCategory && matchSearch;
  });

  // ソート
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

// 一覧ビューを描画
function renderListView() {
  const container = document.getElementById('listView');
  container.innerHTML = '';

  filteredData.forEach(entry => {
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
        <span class="label">一致度:</span> ${entry.matchCount || 0}/${entry.totalSamples || 30}回 (${accuracy}%)
        <div class="accuracy-bar">
          <div class="accuracy-fill" style="width: ${accuracy}%"></div>
        </div>
      </div>
      
      <div class="date-badge">📅 ${dateStr}</div>
    `;

    container.appendChild(card);
  });
}

// 初期化
function init() {
  loadData();

  if (zukanData.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('stats').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('stats').style.display = 'grid';
  document.getElementById('controls').style.display = 'flex';

  updateStats();
  setupFilters();
  applyFilters(); // 初回描画
}

// メニュー開閉機能
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
menuToggle.addEventListener('click', () => {
  sideMenu.classList.toggle('open');
});

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', init);
