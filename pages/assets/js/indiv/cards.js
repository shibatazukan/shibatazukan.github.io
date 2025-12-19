// createCard: 個別カードの生成（indiv 用）
function createCard(entry, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.zIndex = zukanData.length - index;

  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('ja-JP');

  // 写真のパスを取得（共通ユーティリティを利用）
  const imagePath = getImagePath(entry.name);
  console.log(`画像パス: ${imagePath} (名前: "${entry.name}")`);
 
  const imageContent = imagePath
    ? `<img src="${imagePath}" alt="${entry.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
       <div style="display: none; text-align: center; z-index: 1; position: relative;">
         <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
         <div>写真読み込みエラー</div>
       </div>`
    : `<div style="text-align: center; z-index: 1; position: relative;">
         <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
         <div>写真データなし</div>
       </div>`;

  // 位置情報がある場合は住所を取得
  let locationHTML = '';
  if (entry.location && entry.location.latitude && entry.location.longitude) {
    locationHTML = `
      <div style="margin-bottom: 8px;" class="card-location">
        <strong>📍 発見場所:</strong> 
        <span class="location-text" data-card-index="${index}">取得中...</span>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="card-title">${entry.name}</div>
    <div class="rarity">${getRarityStars(entry.name).html}</div>
    <div class="card-image">
      ${imageContent}
    </div>
    <div class="card-description">
      <div style="margin-bottom: 8px;"><strong>これは${entry.name}です。</strong></div>
      <div style="margin-bottom: 8px;"><strong>種類:</strong> ${entry.category}</div>
      <div style="margin-bottom: 8px;"><strong>特徴:</strong> ${entry.description}</div>
      <div style="margin-bottom: 8px;"><strong>一致度:</strong> ${entry.matchCount || 0}/${entry.totalSamples || 10}回</div>
      ${locationHTML}
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

  // 位置情報がある場合は非同期で住所を取得して更新（後回し）
  if (entry.location && entry.location.latitude && entry.location.longitude) {
    setTimeout(async () => {
      const locationText = document.querySelector(`.location-text[data-card-index="${index}"]`);
      if (locationText) {
        const address = await getAddressFromCoords(entry.location.latitude, entry.location.longitude);
        locationText.textContent = address;
      }
    }, 0);
  }

  return card;
}
