let zukanData = [];
let filteredData = [];

// ===== home.jsから追加した共通機能 =====

// ユーザー名を表示
function displayUserName() {
  const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
    username: "ユーザー名",
    completedMissions: [],
    preferences: {}
  };
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) {
    userNameDisplay.textContent = userSettings.username;
  }
}

// ユーザー名を登録・保存する関数
function registerUserName() {
  const userNameDisplay = document.getElementById('userNameDisplay');
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

// 通知表示関数
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.innerHTML = message.replace(/\n/g, '<br>');
  notification.className = 'notification show' + (isError ? ' error' : '');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

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

// ロード
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
      
      // データを再読み込みして画面を更新
      setTimeout(() => {
        loadData();
        updateStats();
        setupFilters();
        applyFilters();
        displayUserName();
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

// ===== 元々のlist.jsの機能 =====

// データ読み込み
function loadData() {
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
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      matchCount: 30,
      totalSamples: 30
    },
    {
      name: 'コハクチョウ',
      category: '鳥類',
      description: '白い羽毛と優雅な姿を持つ大型の鳥。シベリアから渡来する。',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
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
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
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
  displayUserName(); // ユーザー名を表示

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
  applyFilters();
}

// ===== イベントリスナー =====

// メニュー開閉機能
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
menuToggle.addEventListener('click', () => {
  sideMenu.classList.toggle('open');
});

// ユーザー名クリックイベント
const menuTitle = document.querySelector('.menu-title');
if (menuTitle) {
  menuTitle.addEventListener('click', (event) => {
    event.stopPropagation();
    registerUserName();
  });
}

// データ共有ボタン
document.getElementById('shareData').addEventListener('click', () => {
  showNotification('「ファイルに保存」や他アプリでバックアップできます（推奨）', false);
  shareZukanData();
});

// データロードボタン
document.getElementById('loadData').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadZukanData(file);
  }
  e.target.value = '';
});

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', init);