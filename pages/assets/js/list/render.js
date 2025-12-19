// 一覧ビューの描画を担当
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
