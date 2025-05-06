// js/username-display.js
// Display the username beside 'Welcome to SmartPC Hub' if available

document.addEventListener('DOMContentLoaded', function() {
  var username = localStorage.getItem('username');
  var display = document.getElementById('username-display');
  if (display) {
    if (username) {
      // Capitalize the first letter, keep the rest as entered
      const formatted = username.charAt(0).toUpperCase() + username.slice(1);
      display.textContent = formatted;
      display.classList.add('username-unique');
    } else {
      display.textContent = '';
      display.classList.remove('username-unique');
    }
  }
});
