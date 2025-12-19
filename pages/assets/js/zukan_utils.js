// 共通ユーティリティ: レア度・画像パス・住所取得

// レア度マップ（モデル更新時にここを更新）
const RARITY_MAP = {
  'オナガガモ': 3,
  'カラス': 2,
  'カルガモ': 3,
  'カワセミ': 4,
  'キンクロハジロ': 3,
  'サギ': 3,
  'カワラバト': 2,
  'ハクチョウ': 4,
  'スズメ': 2,
  'メジロ': 3,
  'シジュウカラ': 3,
  'ツグミ': 4,
  'アオジ': 3,
  'アオバト': 4,
  'ウミネコ': 3,
  'オナガ': 3,
  'キジ': 4,
  'チョウゲンボウ': 5,
  'ハクセキレイ': 2,
  'ミコアイサ': 4,
  'モズ': 3,
  'ルリビタキ': 4,

  'あやめ': 3,
  'さくら': 2,
  'アリアケスミレ': 4,
  'オオイヌノフグリ': 2,
  'オオバキスミレ': 4,
  'カモガヤ': 2,
  'シャガ': 3,
  'ススキ': 2,
  'セイタカアワダチソウ': 2,
  'タチツボスミレ': 3,
  'チガヤ': 3,
  'ナズナ': 2,
  'ノコンギク': 3,
  'ノジスミレ': 3,
  'ハナニラ': 2,
  'ヒメオドリコソウ': 2,
  'ハルシャギク': 3
};

// 画像マップ
const IMAGE_MAP = {
  'オナガガモ': '../assets/img/オナガガモ.jpg',
  'カラス': '../assets/img/カラス.jpg',
  'カルガモ': '../assets/img/カルガモ.jpg',
  'カワセミ': '../assets/img/カワセミ.jpg',
  'キンクロハジロ': '../assets/img/キンクロハジロ.jpg',
  'サギ': '../assets/img/サギ.jpg',
  'カワラバト': '../assets/img/カワラバト.jpg',
  'ハクチョウ': '../assets/img/ハクチョウ.jpg',
  'スズメ': '../assets/img/スズメ.jpg',
  'メジロ': '../assets/img/メジロ.jpg',
  'シジュウカラ': '../assets/img/シジュウカラ.jpg',
  'ツグミ': '../assets/img/ツグミ.jpg',
  'アオジ': '../assets/img/アオジ.jpg',
  'アオバト': '../assets/img/アオバト.jpg',
  'ウミネコ': '../assets/img/ウミネコ.jpg',
  'オナガ': '../assets/img/オナガ.jpg',
  'キジ': '../assets/img/キジ.jpg',
  'チョウゲンボウ': '../assets/img/チョウゲンボウ.jpg',
  'ハクセキレイ': '../assets/img/ハクセキレイ.jpg',
  'ミコアイサ': '../assets/img/ミコアイサ.jpg',
  'モズ': '../assets/img/モズ.jpg',
  'ルリビタキ': '../assets/img/ルリビタキ.jpg',

  'あやめ': '../assets/img/あやめ.jpg',
  'さくら': '../assets/img/さくら.jpg',
  'アリアケスミレ': '../assets/img/アリアケスミレ.jpg',
  'オオイヌノフグリ': '../assets/img/オオイヌノフグリ.jpg',
  'オオバキスミレ': '../assets/img/オオバキスミレ.jpg',
  'カモガヤ': '../assets/img/カモガヤ.jpg',
  'シャガ': '../assets/img/シャガ.jpg',
  'ススキ': '../assets/img/ススキ.jpg',
  'セイタカアワダチソウ': '../assets/img/セイタカアワダチソウ.jpg',
  'タチツボスミレ': '../assets/img/タチツボスミレ.jpg',
  'チガヤ': '../assets/img/チガヤ.jpg',
  'ナズナ': '../assets/img/ナズナ.jpg',
  'ノコンギク': '../assets/img/ノコンギク.jpg',
  'ノジスミレ': '../assets/img/ノジスミレ.jpg',
  'ハナニラ': '../assets/img/ハナニラ.jpg',
  'ヒメオドリコソウ': '../assets/img/ヒメオドリコソウ.jpg',
  'ハルシャギク': '../assets/img/ハルシャギク.jpg'
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
