// 背景画像
const images = ['../img/home_bg1.jpg', '../img/home_bg2.jpg', '../img/home_bg3.jpg'];
let currentBackgroundIndex = 0; // 背景画像のインデックス
const clearBg = document.getElementById('background-clear');
const blurBg = document.getElementById('background-blur');

// ユーザー設定と図鑑データを初期化/更新する関数に必要な要素
const userNameDisplay = document.getElementById('userNameDisplay');

// -----------------------------------------------------------
// 図鑑カード表示・スワイプ機能に関連する変数
// -----------------------------------------------------------
let zukanData = [];
let currentIndex = 0; // 現在表示中のカードのインデックス
let startX = 0;
let currentX = 0;
let isDragging = false;

// -----------------------------------------------------------
// 【移植】通知表示関数
// -----------------------------------------------------------
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) {
        // notification要素がない場合のフォールバック（コンソール出力）
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
// 【移植】ユーザー設定の初期化/更新関数
// -----------------------------------------------------------
function initSettings() {
    const userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
        username: "ユーザー名",
        completedMissions: [],
        preferences: {}
    };
    if (userNameDisplay) {
        // init時にユーザー名を読み込み表示
        userNameDisplay.textContent = userSettings.username;
    }
}

// -----------------------------------------------------------
// 【移植】ユーザー名を登録・保存する関数
// -----------------------------------------------------------
function registerUserName() {
    if (!userNameDisplay) return;

    // 現在の表示名を取得（初期値として使用）
    const currentName = userNameDisplay.textContent === 'ユーザー名' 
                        ? '' // デフォルト名なら空欄
                        : userNameDisplay.textContent;
    
    const newUserName = prompt('新しいユーザー名を入力してください:', currentName);

    // ユーザーがキャンセルせず、かつ何らかのテキストを入力した場合
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
        // 空欄でOKを押した場合は変更をキャンセル
        showNotification('ユーザー名の変更をキャンセルしました。');
    }
}
// -----------------------------------------------------------

// -----------------------------------------------------------
// 図鑑カード表示機能
// -----------------------------------------------------------

// データ読み込み
function loadData() {
    // デモデータを用意
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
    ];

    // localStorageにデータがなければデモデータを設定
    if (!localStorage.getItem('myZukan')) {
        localStorage.setItem('myZukan', JSON.stringify(demoData));
    }

    zukanData = JSON.parse(localStorage.getItem('myZukan')) || [];
}

// レア度を星で表示
function getRarityStars(name) {
    const rarityMap = {
        'オナガガモ': 3,
        'キンクロハジロ': 3,
        'コハクチョウ': 4 
    };

    const rarity = rarityMap[name] || 3;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rarity ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

// カード作成
function createCard(entry, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.zIndex = zukanData.length - index;

    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('ja-JP');

    card.innerHTML = `
        <div class="card-title">${entry.name}</div>
        <div class="rarity">${getRarityStars(entry.name)}</div>
        <div class="card-image">
            <div style="text-align: center; z-index: 1; position: relative;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <div>写真データなし</div>
            </div>
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

// タッチ/マウスイベント処理 (スワイプ)
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
    // zukanData.length - 1 - currentIndexが、z-indexが高い（＝一番上）のカード
    return cards[zukanData.length - 1 - currentIndex];
}

// グローバル関数として公開 (ボタンクリック用)
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
        const cardIndex = zukanData.length - 1 - index; // カードデータ配列のインデックスに変換
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
// 背景画像関連機能 (元のコードから移植)
// -----------------------------------------------------------

// 背景更新
function updateBackground() {
    if (!images.length) return;
    const nextIndex = (currentBackgroundIndex + 1) % images.length;
    const nextImage = new Image();
    nextImage.src = images[nextIndex];
    nextImage.onload = () => {
        if (clearBg) clearBg.style.backgroundImage = `url('${images[nextIndex]}')`;
        if (blurBg) blurBg.style.backgroundImage = `url('${images[nextIndex]}')`;
        currentBackgroundIndex = nextIndex;
    };
}

// -----------------------------------------------------------
// 初期化処理
// -----------------------------------------------------------

// 初期化 (カード表示と設定読み込みを統合)
function init() {
    // 1. 設定の初期化（ユーザー名の読み込み・表示）
    initSettings();

    // 2. 図鑑データカードの処理
    loadData();

    const container = document.getElementById('cardContainer');
    if (!container) return; // コンテナがない場合は処理を中断

    container.innerHTML = '';

    const emptyState = document.getElementById('emptyState');
    const navigation = document.getElementById('navigation');
    const counter = document.getElementById('counter');

    if (zukanData.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
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
    // 背景の初期設定とアニメーション開始
    if (clearBg && blurBg) {
        clearBg.style.backgroundImage = `url('${images[currentBackgroundIndex]}')`;
        blurBg.style.backgroundImage = `url('${images[currentBackgroundIndex]}')`;
        setTimeout(() => {
            blurBg.style.opacity = '1';
            const overlay = document.getElementById('overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.classList.add('visible');
                }, 350);
            }
        }, 500);

        // 背景の自動切り替え
        setInterval(updateBackground, 5000);
    }

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
});

// ※ 旧コードにあった shareZukanData, getZukanData, loadZukanData, fallbackCopyMethod などの
// データ共有/バックアップ機能は、今回のプロンプトで提供されたカード表示コードには
// 関連するHTMLボタンがないため、省略しています。必要であれば追加してください。