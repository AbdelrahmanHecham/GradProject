document.addEventListener('DOMContentLoaded', () => {
  // Fetch profile info
  fetch('/api/profile', { credentials: 'include' })
    .then(res => res.json())
    .then(profile => {
      if (profile.avatar) {
        document.getElementById('profile-avatar').src = profile.avatar;
      }
      document.getElementById('firstName').value = profile.firstName || '';
      document.getElementById('lastName').value = profile.lastName || '';
      document.getElementById('address').value = profile.address || '';
    });

  // Avatar upload
  const avatarInput = document.getElementById('avatar-upload');
  document.getElementById('change-avatar-btn').onclick = () => avatarInput.click();
  avatarInput.onchange = () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    .then(res => res.json())
    .then(json => {
      if (json.avatar) {
        document.getElementById('profile-avatar').src = json.avatar;
        localStorage.setItem('avatar', json.avatar); // Save avatar globally
        document.getElementById('avatar-upload-status').textContent = 'Avatar updated!';
        // Notify other scripts (e.g., navbar) about avatar change
        window.dispatchEvent(new Event('avatarChanged'));
      } else {
        document.getElementById('avatar-upload-status').textContent = json.message || 'Upload failed.';
      }
    })
    .catch(() => {
      document.getElementById('avatar-upload-status').textContent = 'Upload failed.';
    });
  };

  // Profile update
  document.getElementById('profile-form').onsubmit = function(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const address = document.getElementById('address').value.trim();
    const avatar = document.getElementById('profile-avatar').src;
    fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ firstName, lastName, address, avatar })
    })
    .then(res => res.json())
    .then(json => {
      document.getElementById('profile-update-status').textContent = json.message || 'Update failed.';
    });
  };

  // Password change
  document.getElementById('password-form').onsubmit = function(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    fetch('/api/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    })
    .then(res => res.json())
    .then(json => {
      document.getElementById('password-update-status').textContent = json.message || 'Password change failed.';
    });
  };
});
