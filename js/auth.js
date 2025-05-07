document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const address = form.address.value.trim();
    const username = `${firstName} ${lastName}`;
    const data = {
      username,
      email: form.email.value.trim(),
      password: form.password.value,
      address
    };
  
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await resp.json();
      document.getElementById('message').textContent = result.message;
      if (resp.ok) {
        if (result.message === 'Account created successfully!') {
          // Set a simple auth flag (simulate auto-login on signup)
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('username', data.username);
          if (typeof result.address !== 'undefined') {
            localStorage.setItem('address', result.address || '');
          }
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200); // Wait 1.2s before redirect
        }
        form.reset();
      }
    } catch (err) {
      document.getElementById('message').textContent = 'Error connecting to server.';
      console.error(err);
    }
  });  