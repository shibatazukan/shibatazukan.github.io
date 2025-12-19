// スワイプ・ナビ関連のハンドラ
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
  return cards[zukanData.length - 1 - currentIndex];
}

// グローバル公開
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
    const cardIndex = zukanData.length - 1 - index;
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
