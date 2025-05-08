// js/saveBuild.js
const saveBtn = document.getElementById('save-build-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    try {
      // 'currentBuild' should refer to your JS object for the latest build
      const resp = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ build: currentBuild })
      });
      const data = await resp.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert('Failed to save build.');
    }
  });
}