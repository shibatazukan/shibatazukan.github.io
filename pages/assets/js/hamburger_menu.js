// ========================================
// 1. 初期化とユーザー設定の読み込み
// ========================================
function initHamburgerMenu() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    // ユーザー設定を取得
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
        username: "ユーザー名",
        completedMissions: [],
        preferences: {}
    };
    
    // ユーザー名を表示
    if (userNameDisplay) {
        userNameDisplay.textContent = userSettings.username;
    }
}

// ========================================
// 2. メニュー開閉機能
// ========================================
function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.toggle('open');
        });
    }
}

// ========================================
// 3. ユーザー名登録機能
// ========================================
function registerUserName() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const currentName = userNameDisplay.textContent === 'ユーザー名' 
                        ? '' 
                        : userNameDisplay.textContent;
    
    const newUserName = prompt('新しいユーザー名を入力してください:', currentName);

    if (newUserName !== null && newUserName.trim() !== "") {
        const trimmedName = newUserName.trim();
        
        // ユーザー設定を更新
        const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
            username: "ユーザー名",
            completedMissions: [],
            preferences: {}
        };
        userSettings.username = trimmedName;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));

        // ユーザー名表示を更新
        userNameDisplay.textContent = trimmedName;
        
        // 通知を表示
        showNotification(`ユーザー名を「${trimmedName}」に更新しました！`);
    } else if (newUserName !== null) {
        showNotification('ユーザー名の変更をキャンセルしました。');
    }
}

// ========================================
// 4. 通知表示機能
// ========================================
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.innerHTML = message.replace(/\n/g, '<br>');
    notification.className = 'notification show' + (isError ? ' error' : '');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ========================================
// 5. 図鑑データ取得機能（位置情報対応）
// ========================================
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
        
        // 位置情報付きの発見数をカウント
        const withLocationCount = zukanArray.filter(item => item.location).length;
        
        return {
            version: "1.1",
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
                discoveredAt: item.date,
                location: item.location ? {
                    latitude: item.location.latitude,
                    longitude: item.location.longitude,
                    accuracy: item.location.accuracy,
                    timestamp: item.location.timestamp
                } : null
            })),
            settings: userSettings,
            statistics: {
                totalDiscoveries: zukanArray.length,
                uniqueSpecies: uniqueNames.size,
                categories: categories,
                averageAccuracy: zukanArray.length > 0 ?
                    Math.round(zukanArray.reduce((sum, item) =>
                        sum + ((item.matchCount || 0) / (item.totalSamples || 30) * 100), 0
                    ) / zukanArray.length) : 0,
                withLocation: withLocationCount,
                withoutLocation: zukanArray.length - withLocationCount
            }
        };
    } catch (error) {
        console.error('データ取得エラー:', error);
        return {
            version: "1.1",
            exportDate: new Date().toISOString(),
            appName: "新発田ずかん",
            discoveries: [],
            settings: { username: "ユーザー名", completedMissions: [], preferences: {} },
            statistics: { 
                totalDiscoveries: 0, 
                uniqueSpecies: 0, 
                categories: {}, 
                averageAccuracy: 0,
                withLocation: 0,
                withoutLocation: 0
            }
        };
    }
}

// ========================================
// 6. クリップボードコピー（フォールバック）
// ========================================
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
        const locationMsg = stats.withLocation > 0 ? `（位置情報付き: ${stats.withLocation}件）` : '';
        showNotification(`データをクリップボードにコピーしました！（発見数: ${stats.totalDiscoveries}件${locationMsg}）メモアプリなどに貼り付けて保存してください`);
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

// ========================================
// 7. データ共有機能（位置情報対応）
// ========================================
function shareZukanData() {
    try {
        const zukanData = getZukanData();
        const dataStr = JSON.stringify(zukanData, null, 2);
        const fileName = `shibata-zukan-data-${new Date().toISOString().split('T')[0]}.json`;
        
        // Web Share API対応
        if (navigator.share && navigator.canShare) {
            const file = new File([dataStr], fileName, {
                type: 'application/json',
            });
            if (navigator.canShare({ files: [file] })) {
                const locationMsg = zukanData.statistics.withLocation > 0 
                    ? `、位置情報付き${zukanData.statistics.withLocation}件` 
                    : '';
                navigator.share({
                    files: [file],
                    title: '新発田ずかんデータ',
                    text: `図鑑データ（${zukanData.statistics.totalDiscoveries}件の発見${locationMsg}）をバックアップしました`
                }).then(() => {
                    showNotification('データを他アプリやファイルに保存できます！');
                }).catch((error) => {
                    console.log('共有がキャンセルされました:', error);
                });
                return;
            }
        }
        
        // クリップボードAPI
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(dataStr).then(() => {
                const stats = zukanData.statistics;
                const locationMsg = stats.withLocation > 0 ? `（位置情報付き: ${stats.withLocation}件）` : '';
                showNotification(`データをクリップボードにコピーしました！（発見数: ${stats.totalDiscoveries}件${locationMsg}）メモアプリなどに貼り付けて保存してください`);
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

// ========================================
// 8. データロード機能（位置情報対応）
// ========================================
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
            if (!data.discoveries || !Array.isArray(data.discoveries)) {
                throw new Error('発見データが正しい形式ではありません');
            }
            
            const currentData = JSON.parse(localStorage.getItem('myZukan')) || [];
            const importData = data.discoveries.map(item => ({
                name: item.name,
                category: item.category,
                description: item.description,
                date: item.date || item.discoveredAt || new Date().toISOString(),
                matchCount: item.matchCount || 0,
                totalSamples: item.totalSamples || 30,
                id: item.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                location: item.location ? {
                    latitude: item.location.latitude,
                    longitude: item.location.longitude,
                    accuracy: item.location.accuracy,
                    timestamp: item.location.timestamp
                } : null
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
            const withLocation = newItems.filter(item => item.location).length;
            
            let message = `データをロードしました！\n`;
            message += `- 新規追加: ${newDiscoveries}件\n`;
            if (withLocation > 0) {
                message += `- 位置情報付き: ${withLocation}件\n`;
            }
            if (duplicates > 0) {
                message += `- 重複スキップ: ${duplicates}件\n`;
            }
            message += `- 現在の総発見数: ${mergedData.length}件`;
            
            showNotification(message);
            
            // ユーザー名を再読み込み
            setTimeout(() => initHamburgerMenu(), 1000);
            
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

// ========================================
// 9. イベントリスナーの設定
// ========================================
function setupHamburgerMenuEvents() {
    // メニュー開閉
    setupMenuToggle();
    
    // ユーザー名クリック
    const menuTitle = document.querySelector('.menu-title');
    if (menuTitle) {
        menuTitle.addEventListener('click', (event) => {
            event.stopPropagation();
            registerUserName();
        });
    }
    
    // データ共有ボタン
    const shareButton = document.getElementById('shareData');
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            showNotification('「ファイルに保存」や他アプリでバックアップできます（推奨）', false);
            shareZukanData();
        });
    }
    
    // データロードボタン
    const loadButton = document.getElementById('loadData');
    const fileInput = document.getElementById('fileInput');
    if (loadButton && fileInput) {
        loadButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                loadZukanData(file);
            }
            e.target.value = '';
        });
    }
}

// ========================================
// 10. 自動初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initHamburgerMenu();
    setupHamburgerMenuEvents();
});