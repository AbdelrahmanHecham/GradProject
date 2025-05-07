// js/login.js
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    email: f.email.value.trim(),
    password: f.password.value
  };

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    document.getElementById('login-message').textContent = json.message;

    if (res.ok) {
      // Set a simple auth flag (simulate login)
      localStorage.setItem('isAuthenticated', 'true');
      if (json.username) {
        localStorage.setItem('username', json.username);
      }
      if (json.address !== undefined) {
        localStorage.setItem('address', json.address || '');
      }
      // Redirect to recommendations or dashboard
      window.location.href = 'recommendations.html';
    }
  } catch (err) {
    document.getElementById('login-message').textContent = 'Server error.';
    console.error(err);
  }
});