function toggleMenu(event) {
  event.stopPropagation();
  const navList = document.getElementById('mainNav');
  navList.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const navList = document.getElementById('mainNav');
  const hamburger = document.querySelector('.hamburger');
  if (navList && navList.classList.contains('open')) {
    if (!navList.contains(e.target) && !hamburger.contains(e.target)) {
      navList.classList.remove('open');
    }
  }
});

// Accessibility: close menu with Escape key
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const navList = document.getElementById('mainNav');
    if (navList) navList.classList.remove('open');
  }
});
