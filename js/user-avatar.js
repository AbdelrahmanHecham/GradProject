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

    // Get initials
    let username = localStorage.getItem('username') || '';
    let initials = '?';
    if (username) {
      let parts = username.split(' ');
      let first = parts[0]?.charAt(0).toUpperCase() || '';
      let last = parts[1]?.charAt(0).toUpperCase() || '';
      initials = first + (last || '');
    }
    avatar.textContent = initials;

    // Modal for editing address
    avatar.onclick = function(e) {
      e.stopPropagation();
      let dropdown = document.getElementById('avatar-dropdown');
      if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        return;
      }
      dropdown = document.createElement('div');
      dropdown.id = 'avatar-dropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.top = '52px';
      dropdown.style.right = '0';
      dropdown.style.background = '#fff';
      dropdown.style.border = '1px solid #ddd';
      dropdown.style.borderRadius = '8px';
      dropdown.style.boxShadow = '0 2px 12px rgba(0,0,0,0.13)';
      dropdown.style.padding = '0.5rem 0';
      dropdown.style.zIndex = '1003';
      dropdown.style.minWidth = '160px';
      dropdown.innerHTML = `
        <button id="profile-btn" style="background:none;border:none;width:100%;text-align:left;padding:0.7rem 1.2rem;font-size:1rem;cursor:pointer;color:#00bcd4;">My Profile</button>
        <button id="logout-btn" style="background:none;border:none;width:100%;text-align:left;padding:0.7rem 1.2rem;font-size:1rem;cursor:pointer;color:#f44336;">Logout</button>
      `;
      avatar.parentNode.style.position = 'relative';
      avatar.parentNode.appendChild(dropdown);
      
      document.getElementById('profile-btn').onclick = function(ev) {
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
          modal.style.background = '#fff';
          modal.style.padding = '2rem 1.5rem';
          modal.style.borderRadius = '10px';
          modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
          modal.style.zIndex = '1004';
          let fullName = (localStorage.getItem('username') || '').trim();
          let address = localStorage.getItem('address') || '';
          modal.innerHTML = `<h3 style='margin-bottom:1rem;'>My Profile</h3>
            <div style='margin-bottom:1rem;'><strong>Name:</strong> ${fullName || 'N/A'}</div>
            <div style='margin-bottom:1rem;'><strong>Address:</strong> <span id='profile-address'>${address || 'N/A'}</span></div>
            <label style='display:block; margin-bottom:0.5rem;'>
              Edit Address:
              <input id='address-input' type='text' style='width:100%;padding:0.5rem;margin-top:0.5rem;' value="${address}">
            </label>
            <button id='save-address-btn' style='margin-top:1rem;background:#00bcd4;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:5px;cursor:pointer;'>Save</button>
            <button id='close-profile-btn' style='margin-top:1rem;margin-left:1rem;background:#f44336;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:5px;cursor:pointer;'>Close</button>
            <div id='address-status' style='margin-top:1rem;color:#009688;'></div>`;
          document.body.appendChild(modal);
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
