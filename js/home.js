// 背景画像
const images = ['../../img/home_bg1.jpg', '../../img/home_bg2.jpg', '../../img/home_bg3.jpg'];
let currentIndex = 0;
const clearBg = document.getElementById('background-clear');
const blurBg = document.getElementById('background-blur');
const userNameDisplay = document.getElementById('userNameDisplay');

// ユーザー設定と図鑑データを初期化/更新する関数
function init() {
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
        username: "ユーザー名",
        completedMissions: [],
        preferences: {}
    };
    if (userNameDisplay) {
        userNameDisplay.textContent = userSettings.username;
    }
}

// 通知表示関数
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    // メッセージが改行を含む場合は適切に表示
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
            if (typeof init === 'function') {
                setTimeout(() => init(), 1000);
            }
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

// --- 初期処理とイベントリスナー ---

// 背景の初期設定とアニメーション開始
clearBg.style.backgroundImage = `url('${images[currentIndex]}')`;
blurBg.style.backgroundImage = `url('${images[currentIndex]}')`;
setTimeout(() => {
    blurBg.style.opacity = '1';
    setTimeout(() => {
        document.getElementById('overlay').classList.add('visible');
    }, 350);
}, 500);

// 背景の自動切り替え
setInterval(updateBackground, 5000);

// メニュー開閉
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
});

// 「共有/ファイルに保存」ボタン
document.getElementById('shareData').addEventListener('click', () => {
    showNotification('「ファイルに保存」や他アプリでバックアップできます（推奨）', false);
    shareZukanData();
});

// データロード
document.getElementById('loadData').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadZukanData(file);
    }
    // ファイル選択をリセット
    e.target.value = '';
});

// 初期化実行 (ユーザー名などの設定を読み込み)
document.addEventListener('DOMContentLoaded', init);
