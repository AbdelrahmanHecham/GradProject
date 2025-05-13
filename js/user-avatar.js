// User Avatar: Show initials at top right and allow editing address
(function() {
  if (
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname === '/' ||
    window.location.pathname === ''
  ) {
    return; // Don't show on home
  }
  document.addEventListener('DOMContentLoaded', function() {
    // --- Dark/Light Mode Toggle ---
    let darkToggle = document.getElementById('theme-toggle');
    if (!darkToggle) {
      darkToggle = document.createElement('button');
      darkToggle.id = 'theme-toggle';
      darkToggle.className = 'theme-toggle-btn';
      darkToggle.setAttribute('aria-label', 'Toggle dark/light mode');
      darkToggle.title = 'Toggle dark/light mode';
      darkToggle.innerHTML = '<span class="theme-icon">&#9788;</span>'; // Default sun icon
      // Place toggle before avatar
      var header = document.querySelector('header');
      if (header) {
        header.appendChild(darkToggle);
      } else {
        document.body.appendChild(darkToggle);
      }
    }

    // --- Avatar ---
    let avatar = document.getElementById('user-avatar');
    if (!avatar) {
      avatar = document.createElement('div');
      avatar.id = 'user-avatar';
      avatar.className = 'user-avatar';
      avatar.setAttribute('aria-label', 'User profile avatar');
      avatar.title = 'Profile';
      // Place avatar after toggle
      var header = document.querySelector('header');
      if (header) {
        header.appendChild(avatar);
      } else {
        document.body.appendChild(avatar);
      }
    }
    // Ensure toggle is left of avatar
    if (header && darkToggle && avatar) {
      header.insertBefore(darkToggle, avatar);
    }

    // --- Theme Logic ---
    function setTheme(theme) {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      localStorage.setItem('theme', theme);
      // Update icon
      if (theme === 'dark') {
        darkToggle.innerHTML = '<span class="theme-icon">&#9790;</span>'; // Moon
      } else {
        darkToggle.innerHTML = '<span class="theme-icon">&#9788;</span>'; // Sun
      }
    }
    // Initial theme
    let savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    // Toggle event
    darkToggle.onclick = function(e) {
      e.stopPropagation();
      let current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    };

    // Render avatar (image or initials)
    function renderAvatar() {
      let avatarUrl = localStorage.getItem('avatar');
      if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== '') {
        avatar.innerHTML = `<img src="${avatarUrl}" alt="User Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      } else {
        let username = localStorage.getItem('username') || '';
        let initials = '?';
        if (username) {
          let parts = username.split(' ');
          let first = parts[0]?.charAt(0).toUpperCase() || '';
          let last = parts[1]?.charAt(0).toUpperCase() || '';
          initials = first + (last || '');
        }
        avatar.textContent = initials;
      }
    }
    renderAvatar();
    // Listen for avatar changes
    window.addEventListener('avatarChanged', renderAvatar);

    // Modal for editing address
    avatar.onclick = function(e) {
      e.stopPropagation();
      window.location.href = 'profile.html';
      return;
      dropdown.style.boxShadow = '0 2px 12px rgba(0,0,0,0.13)';
      dropdown.style.padding = '0.5rem 0';
      dropdown.style.zIndex = '1003';
      dropdown.style.minWidth = '160px';
      const profileBtn = document.createElement('button');
      profileBtn.id = 'profile-btn';
      profileBtn.textContent = 'My Profile';
      profileBtn.style.display = 'block';
      profileBtn.style.width = '100%';
      profileBtn.style.background = 'inherit';
      profileBtn.style.color = 'inherit';
      profileBtn.style.border = 'none';
      profileBtn.style.padding = '0.8rem 1.2rem';
      profileBtn.style.textAlign = 'left';
      profileBtn.style.cursor = 'pointer';
      profileBtn.style.fontSize = '1rem';
      profileBtn.style.borderRadius = '8px 8px 0 0';
      profileBtn.onmouseover = function() { this.style.background = '#f1f6fa'; };
      profileBtn.onmouseout = function() { this.style.background = 'inherit'; };
      profileBtn.onclick = function(ev) {
        ev.stopPropagation();
        dropdown.style.display = 'none';
        let modal = document.getElementById('profile-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'profile-modal';
          modal.style.position = 'fixed';
          modal.style.top = '50%';
          modal.style.left = '50%';
          modal.style.transform = 'translate(-50%, -50%)';
          // Dark mode support
          if (document.body.classList.contains('dark-mode')) {
            modal.style.background = '#23262f';
            modal.style.color = '#f6f7fa';
            modal.style.boxShadow = '0 4px 24px rgba(33,150,243,0.20)';
          } else {
            modal.style.background = '#fff';
            modal.style.color = '#222e3c';
            modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
          }
          modal.style.padding = '2rem 1.5rem';
          modal.style.borderRadius = '10px';
          modal.style.zIndex = '1004';
          let fullName = (localStorage.getItem('username') || '').trim();
          let address = localStorage.getItem('address') || '';
          modal.innerHTML = `<h3 style='margin-bottom:1rem;'>My Profile</h3>
            <div style='margin-bottom:1rem;'><strong>Name:</strong> ${fullName || 'N/A'}</div>
            <div style='margin-bottom:1rem;'><strong>Address:</strong> <span id='profile-address'>${address || 'N/A'}</span></div>
            <label style='display:block; margin-bottom:0.5rem; text-align:left;'>
              Edit Address:
              <input id='address-input' type='text' value="${address}" style="width:100%;padding:0.5rem;margin-top:0.5rem; border-radius:5px; border:1px solid #ccc; background: inherit; color: inherit;">
            </label>
            <button id='save-address-btn' style='margin-top:1rem;background:#00bcd4;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:5px;cursor:pointer;'>Save</button>
            <button id='close-profile-btn' style='margin-top:1rem;margin-left:1rem;background:#f44336;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:5px;cursor:pointer;'>Close</button>
            <div id='address-status' style='margin-top:1rem;color:#009688;'></div>`;
          document.body.appendChild(modal);
          function applyModalTheme() {
            if (!modal) return;
            modal.style.textAlign = 'left'; // Always left-align text
            if (document.body.classList.contains('dark-mode')) {
              modal.style.background = '#23262f';
              modal.style.color = '#f6f7fa';
              modal.style.boxShadow = '0 4px 24px rgba(33,150,243,0.20)';
              const input = modal.querySelector('#address-input');
              if (input) {
                input.style.background = '#191b22';
                input.style.color = '#f6f7fa';
                input.style.border = '1.5px solid #4fc3f7';
              }
              const saveBtn = modal.querySelector('#save-address-btn');
              if (saveBtn) {
                saveBtn.style.background = '#4fc3f7';
                saveBtn.style.color = '#181a20';
              }
              const closeBtn = modal.querySelector('#close-profile-btn');
              if (closeBtn) {
                closeBtn.style.background = '#f44336';
                closeBtn.style.color = '#fff';
              }
            } else {
              modal.style.background = '#fff';
              modal.style.color = '#222e3c';
              modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
              const input = modal.querySelector('#address-input');
              if (input) {
                input.style.background = '';
                input.style.color = '';
                input.style.border = '1px solid #ccc';
              }
              const saveBtn = modal.querySelector('#save-address-btn');
              if (saveBtn) {
                saveBtn.style.background = '#00bcd4';
                saveBtn.style.color = '#fff';
              }
              const closeBtn = modal.querySelector('#close-profile-btn');
              if (closeBtn) {
                closeBtn.style.background = '#f44336';
                closeBtn.style.color = '#fff';
              }
            }
          }
          // Initial apply
          applyModalTheme();
          // Listen for theme changes
          if (!window._profileModalThemeListener) {
            window._profileModalThemeListener = true;
            document.addEventListener('themechange', function() {
              const modal = document.getElementById('profile-modal');
              if (modal) applyModalTheme();
            });
          }
          // Patch the theme toggle to dispatch a custom event
          const themeToggle = document.getElementById('theme-toggle');
          if (themeToggle && !themeToggle._patched) {
            const origOnClick = themeToggle.onclick;
            themeToggle.onclick = function(e) {
              if (origOnClick) origOnClick.call(this, e);
              setTimeout(function() {
                document.dispatchEvent(new Event('themechange'));
              }, 10);
            };
            themeToggle._patched = true;
          }
        } else {
          modal.style.display = 'block';
        }
        // Always update address display when opening modal
        const address = localStorage.getItem('address');
        const addressDisplay = document.getElementById('profile-address');
        if (addressDisplay) {
          addressDisplay.textContent = address && address.trim() ? address : 'N/A';
        }
        document.getElementById('close-profile-btn').onclick = function() {
          modal.style.display = 'none';
        };
        document.getElementById('save-address-btn').onclick = async function() {
          const newAddr = document.getElementById('address-input').value.trim();
          localStorage.setItem('address', newAddr);
          // Always update the address display immediately after saving
          const addressDisplay = document.getElementById('profile-address');
          if (addressDisplay) {
            addressDisplay.textContent = newAddr || 'N/A';
          }
          // Clear previous status message
          document.getElementById('address-status').textContent = '';
          // Send to server
          try {
            const resp = await fetch('/api/update-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: newAddr })
            });
            const res = await resp.json();
            if (resp.ok) {
              document.getElementById('address-status').textContent = res.message || 'Address updated.';
              // Auto-close modal and clear status after 3 seconds
              setTimeout(function() {
                document.getElementById('address-status').textContent = '';
                if (modal) modal.style.display = 'none';
              }, 3000);
            } else {
              document.getElementById('address-status').textContent = res.message || 'Error updating address.';
            }
          } catch(e) {
            document.getElementById('address-status').textContent = 'Network error updating address.';
          }
        };
      };
      document.getElementById('logout-btn').onclick = async function(ev) {
        ev.stopPropagation();
        localStorage.clear();
        try {
          await fetch('/api/logout', { method: 'POST' });
        } catch (e) {}
        window.location.href = 'signup.html';
      };

      // Hide dropdown when clicking outside
      document.addEventListener('click', function handler(event) {
        if (!dropdown.contains(event.target) && event.target !== avatar) {
          dropdown.style.display = 'none';
          document.removeEventListener('click', handler);
        }
      });
    };

  });
})();
