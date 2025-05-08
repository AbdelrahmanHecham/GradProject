// js/logout.js
// Simple logout logic: clears localStorage and redirects to login
function logout() {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('username');
  localStorage.removeItem('address');
  window.location.href = 'login.html';
}

// If you want to attach this to a button:
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', logout);
});
