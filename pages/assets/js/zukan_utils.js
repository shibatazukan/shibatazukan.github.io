// 共通ユーティリティ: レア度・画像パス・住所取得

// レア度マップ（モデル更新時にここを更新）
const RARITY_MAP = {
  // 昆虫
  'アオドウガネ': 3,
  'アゲハチョウ': 3,
  'アブラゼミ': 2,
  'ウスバカマキリ': 3,
  'オオハリアリ': 4,
  'オオミズアオ': 5,
  'オニヤンマ': 4,
  'キリギリス': 3,
  'ギンヤンマ': 4,
  'クサギカメムシ': 2,
  'クマバチ': 3,
  'ゲジゲジ': 2,
  'ケラ': 4,
  'コオロギ': 2,
  'コクゾウムシ': 2,
  'コクワガタ': 4,
  'ゴマダラカミキリ': 3,
  'シオカラトンボ': 2,
  'ショウリョウバッタ': 2,
  'スズムシ': 3,
  'チャバネゴキブリ': 1,
  'トノサマバッタ': 3,
  'ナナホシテントウ': 3,
  'ナミテントウ': 2,
  'ノコギリクワガタ': 4,
  'ヒアリ': 5,
  'ヒグラシ': 3,
  'マイコアカネ': 4,
  'ミツバチ': 2,
  'モンシロチョウ': 2,
  'ヤマトカブト': 4,
  'ヤマトシジミ': 2,
  
  // 鳥類
  'アオジ': 3,
  'アオバト': 4,
  'ウミネコ': 3,
  'オナガ': 3,
  'オナガガモ': 3,
  'カラス': 1,
  'カルガモ': 3,
  'カワセミ': 4,
  'カワラバト': 1,
  'キジ': 4,
  'キンクロハジロ': 3,
  'サギ': 3,
  'シジュウカラ': 2,
  'スズメ': 2,
  'チョウゲンボウ': 5,
  'ツグミ': 3,
  'ハクセキレイ': 2,
  'コハクチョウ': 4,
  'フクロウ': 5,
  'ミコアイサ': 4,
  'メジロ': 3,
  'モズ': 3,
  'ルリビタキ': 4,
  
  // 植物
  'アヤメ': 3,
  'アリアケスミレ': 4,
  'イロハモミジ': 2,
  'オオイヌノフグリ': 2,
  'オオバキスミレ': 3,
  'オギ': 2,
  'カモガヤ': 1,
  'キンモクセイ': 2,
  'サクラ': 2,
  'シャガ': 3,
  'シロツメクサ': 1,
  'ススキ': 2,
  'セイタカアワダチソウ': 1,
  'セリ': 3,
  'タチツボスミレ': 3,
  'タンポポ': 1,
  'チューリップ': 2,
  'ナズナ': 2,
  'ノコンギク': 2,
  'ノジスミレ': 3,
  'ハナニラ': 2,
  'ハルジオン': 2,
  'ハルシャギク': 3,
  'ヒマワリ': 2,
  'ヒメオドリコソウ': 2,
  'ライチョウ': 5,
  'タテヤマリンドウ': 4,
  'カノユユリ': 4
};

// 画像マップ
// 画像マップ
const IMAGE_MAP = {
  // 昆虫
  'アオドウガネ': '../assets/img/アオドウガネ.jpg',
  'アゲハチョウ': '../assets/img/アゲハチョウ.jpg',
  'アブラゼミ': '../assets/img/アブラゼミ.jpg',
  'ウスバカマキリ': '../assets/img/ウスバカマキリ.jpg',
  'オオハリアリ': '../assets/img/オオハリアリ.jpg',
  'オオミズアオ': '../assets/img/オオミズアオ.jpg',
  'オニヤンマ': '../assets/img/オニヤンマ.jpg',
  'キリギリス': '../assets/img/キリギリス.jpg',
  'ギンヤンマ': '../assets/img/ギンヤンマ.jpg',
  'クサギカメムシ': '../assets/img/クサギカメムシ.jpg',
  'クマバチ': '../assets/img/クマバチ.jpg',
  'ゲジゲジ': '../assets/img/ゲジゲジ.jpg',
  'ケラ': '../assets/img/ケラ.jpg',
  'コオロギ': '../assets/img/コオロギ.jpg',
  'コクゾウムシ': '../assets/img/コクゾウムシ.jpg',
  'コクワガタ': '../assets/img/コクワガタ.jpg',
  'ゴマダラカミキリ': '../assets/img/ゴマダラカミキリ.jpg',
  'シオカラトンボ': '../assets/img/シオカラトンボ.jpg',
  'ショウリョウバッタ': '../assets/img/ショウリョウバッタ.jpg',
  'スズムシ': '../assets/img/スズムシ.jpg',
  'チャバネゴキブリ': '../assets/img/チャバネゴキブリ.jpg',
  'トノサマバッタ': '../assets/img/トノサマバッタ.jpg',
  'ナナホシテントウ': '../assets/img/ナナホシテントウ.jpg',
  'ナミテントウ': '../assets/img/ナミテントウ.jpg',
  'ノコギリクワガタ': '../assets/img/ノコギリクワガタ.jpg',
  'ヒアリ': '../assets/img/ヒアリ.jpg',
  'ヒグラシ': '../assets/img/ヒグラシ.jpg',
  'マイコアカネ': '../assets/img/マイコアカネ.jpg',
  'ミツバチ': '../assets/img/ミツバチ.jpg',
  'モンシロチョウ': '../assets/img/モンシロチョウ.jpg',
  'ヤマトカブト': '../assets/img/ヤマトカブト.jpg',
  'ヤマトシジミ': '../assets/img/ヤマトシジミ.jpg',
  
  // 鳥類
  'アオジ': '../assets/img/アオジ.jpg',
  'アオバト': '../assets/img/アオバト.jpg',
  'ウミネコ': '../assets/img/ウミネコ.jpg',
  'オナガ': '../assets/img/オナガ.jpg',
  'オナガガモ': '../assets/img/オナガガモ.jpg',
  'カラス': '../assets/img/カラス.jpg',
  'カルガモ': '../assets/img/カルガモ.jpg',
  'カワセミ': '../assets/img/カワセミ.jpg',
  'カワラバト': '../assets/img/カワラバト.jpg',
  'キジ': '../assets/img/キジ.jpg',
  'キンクロハジロ': '../assets/img/キンクロハジロ.jpg',
  'サギ': '../assets/img/サギ.jpg',
  'シジュウカラ': '../assets/img/シジュウカラ.jpg',
  'スズメ': '../assets/img/スズメ.jpg',
  'チョウゲンボウ': '../assets/img/チョウゲンボウ.jpg',
  'ツグミ': '../assets/img/ツグミ.jpg',
  'ハクセキレイ': '../assets/img/ハクセキレイ.jpg',
  'コハクチョウ': '../assets/img/コハクチョウ.jpg',
  'フクロウ': '../assets/img/フクロウ.jpg',
  'ミコアイサ': '../assets/img/ミコアイサ.jpg',
  'メジロ': '../assets/img/メジロ.jpg',
  'モズ': '../assets/img/モズ.jpg',
  'ルリビタキ': '../assets/img/ルリビタキ.jpg',
  
  // 植物
  'アヤメ': '../assets/img/アヤメ.jpg',
  'アリアケスミレ': '../assets/img/アリアケスミレ.jpg',
  'イロハモミジ': '../assets/img/イロハモミジ.jpg',
  'オオイヌノフグリ': '../assets/img/オオイヌノフグリ.jpg',
  'オオバキスミレ': '../assets/img/オオバキスミレ.jpg',
  'オギ': '../assets/img/オギ.jpg',
  'カモガヤ': '../assets/img/カモガヤ.jpg',
  'キンモクセイ': '../assets/img/キンモクセイ.jpg',
  'サクラ': '../assets/img/サクラ.jpg',
  'シャガ': '../assets/img/シャガ.jpg',
  'シロツメクサ': '../assets/img/シロツメクサ.jpg',
  'ススキ': '../assets/img/ススキ.jpg',
  'セイタカアワダチソウ': '../assets/img/セイタカアワダチソウ.jpg',
  'セリ': '../assets/img/セリ.jpg',
  'タチツボスミレ': '../assets/img/タチツボスミレ.jpg',
  'タンポポ': '../assets/img/タンポポ.jpg',
  'チューリップ': '../assets/img/チューリップ.jpg',
  'ナズナ': '../assets/img/ナズナ.jpg',
  'ノコンギク': '../assets/img/ノコンギク.jpg',
  'ノジスミレ': '../assets/img/ノジスミレ.jpg',
  'ハナニラ': '../assets/img/ハナニラ.jpg',
  'ハルジオン': '../assets/img/ハルジオン.jpg',
  'ハルシャギク': '../assets/img/ハルシャギク.jpg',
  'ヒマワリ': '../assets/img/ヒマワリ.jpg',
  'ヒメオドリコソウ': '../assets/img/ヒメオドリコソウ.jpg',
  'ライチョウ': '../assets/img/ライチョウ.jpg',
  'タテヤマリンドウ': '../assets/img/タテヤマリンドウ.jpg',
  'カノユユリ': '../assets/img/カノユユリ.jpg'
};

// レア度を星表現で返す: {html, value}
function getRarityStars(name) {
  const value = RARITY_MAP[name] || 3;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= value ? '' : 'empty'}">★</span>`;
  }
  return { html: stars, value };
}

// 画像パスを返す: 完全一致 -> 部分一致 -> デフォルト
function getImagePath(name) {
  if (IMAGE_MAP[name]) return IMAGE_MAP[name];

  // 部分一致: name が key を含む, または key が name を含む
  for (const [key, value] of Object.entries(IMAGE_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  return '../assets/img/noimage.jpg';
}

// 緯度経度から住所を取得（OpenStreetMap Nominatim API使用）
async function getAddressFromCoords(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja&zoom=18`
    );

    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [];
      const prefecture = addr.state || addr.prefecture || '';
      if (prefecture) parts.push(prefecture);
      const city = addr.city || addr.town || addr.village || '';
      if (city) parts.push(city);
      const district = addr.suburb || addr.quarter || addr.neighbourhood || '';
      if (district) parts.push(district);
      const houseNumber = addr.house_number || '';
      if (houseNumber) parts.push(houseNumber);
      if (parts.length > 0) return parts.join('');
      return '位置情報あり';
    }
    return '位置情報あり';
  } catch (error) {
    console.error('住所取得エラー:', error);
    return '位置情報あり';
  }
}

// グローバルに公開（既存のコードはグローバル関数を期待している）
window.getRarityStars = getRarityStars;
window.getImagePath = getImagePath;
window.getAddressFromCoords = getAddressFromCoords;
