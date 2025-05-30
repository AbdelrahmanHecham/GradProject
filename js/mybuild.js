// js/mybuild.js
// Fetch and render user's saved builds

let builds = [];

document.addEventListener('DOMContentLoaded', function() {
  fetch('/api/builds', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      console.log('DEBUG /api/builds response:', data);
      const newBuilds = Array.isArray(data) ? data : data.builds;
      if (!Array.isArray(newBuilds) || newBuilds.length === 0) {
        document.getElementById('mybuild-list').innerHTML = '<p>No saved builds found.</p>';
        builds = [];
        return;
      }
      renderBuilds(newBuilds);
    })
    .catch(() => {
      document.getElementById('mybuild-list').innerHTML = '<p>Error loading builds.</p>';
    });
});


function renderBuilds(newBuilds) {
  builds = Array.isArray(newBuilds) ? newBuilds : [];
  const container = document.getElementById('mybuild-list');
  container.innerHTML = '';
  if (!Array.isArray(builds)) return;
  builds.forEach(b => {
    const build = b.build || {};
    const buildId = b.id;
    let total = 0;
    let html = `<div class="build-card">
      <h3><i class="fas fa-box"></i> <input type="text" class="build-name-input" value="${(b.purpose && b.purpose.trim() !== '') ? b.purpose : 'Untitled Build'}" placeholder="Enter build name" style="font-size:1.1rem;font-weight:600;border:none;background:transparent;outline:1px solid #ddd;border-radius:4px;padding:2px 8px;width:60%"><span class="name-status" style="margin-left:8px;font-size:0.95rem;color:#2196f3"></span></h3>
      <div><strong>Saved:</strong> ${b.savedAt ? new Date(b.savedAt).toLocaleString() : '5/7/2025, 11:14:25 AM (Local)'}</div>
      <form class="update-build-form" data-build-id="${buildId}">
        <table class="build-components"><thead><tr><th>Component</th><th>Model</th><th>Qty</th><th>Price</th></tr></thead><tbody>`;
    for (const [category, comp] of Object.entries(build)) {
      let model = comp.model || comp.name || '-';
      let qty = comp.quantity || 1;
      let price = comp.price || 0;
      if (model === 'No match') {
        qty = 0;
        price = 0;
      } else {
        qty = Math.max(1, parseInt(qty) || 1);
      }
      total += parseFloat(price) * parseInt(qty);
      html += `<tr>
        <td>${category}</td>
        <td>${model}</td>
        <td><input type="number" min="${model === 'No match' ? 0 : 1}" value="${qty}" name="qty-${category}" style="width:60px"${model === 'No match' ? ' disabled' : ''}></td>
        <td>$${model === 'No match' ? '0' : (price || '-')}<\/td>
      <\/tr>`;
    }
    html += `</tbody></table>
        <div style="margin-top:8px"><strong>Total Price:</strong> $${total.toFixed(2)}</div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
          <button type="submit" class="btn update-btn">Update</button>
          <button type="button" class="btn delete-btn" style="background:linear-gradient(90deg,#f44336 60%,#ff9800 100%);color:#fff;border-radius:8px;font-weight:600;padding:0.55rem 1.4rem;box-shadow:0 2px 8px rgba(244,67,54,0.09);border:none;transition:background 0.2s,box-shadow 0.2s;">Delete</button>
          <span class="update-status" style="margin-left:10px;color:#2196f3"></span>
        </div>
      </form>
    </div>`;
    container.innerHTML += `<div class="build-card-wrapper">${html}</div>`;
  });

  // Attach event listeners for build name input (save on Enter)
  document.querySelectorAll('.build-card').forEach(card => {
    const nameInput = card.querySelector('.build-name-input');
    const buildId = card.querySelector('.update-build-form').dataset.buildId;
    const nameStatus = card.querySelector('.name-status');
    if (nameInput) {
      nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          let newName = nameInput.value.trim();
          if (!newName || newName === 'Untitled Build') return;
          nameStatus.textContent = 'Saving...';
          // Get the build object for this build
          const buildIdx = builds.findIndex(x => x.id == buildId);
          if (buildIdx === -1) {
            nameStatus.textContent = 'Build not found.';
            return;
          }
          const buildObj = JSON.parse(JSON.stringify(builds[buildIdx].build));
          fetch(`/api/builds/${buildId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ build: buildObj, purpose: newName, savedAt: new Date().toISOString() })
          })
          .then(res => res.json())
          .then(json => {
            if (json.message && json.message.includes('updated')) {
              nameStatus.textContent = 'Saved!';
              // Update the builds array so the new name persists in UI and future updates
              builds[buildIdx].purpose = newName;
              setTimeout(() => { nameStatus.textContent = ''; }, 1200);
            } else {
              nameStatus.textContent = json.message || 'Update failed.';
            }
          })
          .catch(() => {
            nameStatus.textContent = 'Error saving name.';
          });
        }
      });
    }
  });

  // Attach event listeners for update
  document.querySelectorAll('.update-build-form').forEach(form => {
    // Delete button logic
    const deleteBtn = form.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async function() {
      if (!confirm('Are you sure you want to delete this build?')) return;
      const buildId = form.dataset.buildId;
      const cardWrapper = form.closest('.build-card-wrapper');
      try {
        const res = await fetch(`/api/builds/${buildId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          cardWrapper.style.transition = 'opacity 0.4s, transform 0.4s';
          cardWrapper.style.opacity = '0';
          cardWrapper.style.transform = 'scale(0.96) translateY(20px)';
          setTimeout(() => {
            cardWrapper.remove();
            // Refresh build list from backend after delete
            fetch('/api/builds', { credentials: 'include' })
              .then(res => res.json())
              .then(newData => renderBuilds(newData.builds || newData));
          }, 400);
        } else {
          alert(data.message || 'Failed to delete build.');
        }
      } catch (err) {
        alert('Network error.');
      }
    });
    // Update button logic
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const buildId = this.dataset.buildId;
      const buildIdx = builds.findIndex(x => x.id == buildId);
      if (buildIdx === -1) return;
      const buildObj = JSON.parse(JSON.stringify(builds[buildIdx].build));
      // Update quantities from form
      Object.keys(buildObj).forEach(category => {
        const qtyInput = this.querySelector(`[name="qty-${category}"]`);
        if (qtyInput) {
          buildObj[category].quantity = parseInt(qtyInput.value) || 1;
        }
      });
      // Get build name from input and set as purpose
      const buildNameInput = this.closest('.build-card').querySelector('.build-name-input');
      let buildName = buildNameInput ? buildNameInput.value.trim() : '';
      if (buildName === 'Untitled Build') buildName = '';
      // Use current time for savedAt
      const savedAt = new Date().toISOString();
      const statusSpan = this.querySelector('.update-status');
      statusSpan.textContent = 'Saving...';
      fetch(`/api/builds/${buildId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ build: buildObj, purpose: buildName, savedAt })
      })
      .then(res => res.json())
      .then(json => {
        if (json.message && json.message.includes('updated')) {
          statusSpan.textContent = 'Updated!';
          setTimeout(() => { statusSpan.textContent = ''; }, 1200);
          // Refresh builds to show new totals
          fetch('/api/builds', { credentials: 'include' })
            .then(res => res.json())
            .then(newData => renderBuilds(newData.builds || newData));
        } else {
          statusSpan.textContent = json.message || 'Update failed.';
        }
      })
      .catch(() => {
        statusSpan.textContent = 'Error updating build.';
      });
    });
  });
}
