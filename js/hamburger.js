document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');

  if (!menuToggle || !sideMenu) return;

  menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
  });
});
