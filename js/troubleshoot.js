// js/troubleshoot.js
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('error-search');
    const resultsDiv = document.getElementById('troubleshoot-results');
    let db = [];
  
    // Load the JSON database
    fetch('data/troubleshooting.json')
      .then(res => res.json())
      .then(json => db = json)
      .catch(err => {
        resultsDiv.innerHTML = `<p style="color:#d9534f;">Failed to load troubleshooting data.</p>`;
        console.error(err);
      });
  
    // Filter & render on each keystroke
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        resultsDiv.innerHTML = '';
        return;
      }
      const matches = db.filter(item =>
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.symptom.toLowerCase().includes(q)
      );
  
      if (!matches.length) {
        resultsDiv.innerHTML = `<p>No matching solutions found.</p>`;
        return;
      }
  
      resultsDiv.innerHTML = matches.map(item => `
        <div class="error-card" style="
          border:1px solid #ddd;
          padding:1rem;
          margin-bottom:1rem;
          border-radius:8px;
          background:#fff;
        ">
          <h3 style="margin:0 0.5rem 0.5rem;">
            <i class="fas fa-code"></i> ${item.code} — ${item.title}
          </h3>
          <p><strong>Symptom:</strong> ${item.symptom}</p>
          <p><strong>Solution:</strong> ${item.solution}</p>
        </div>
      `).join('');
    });
  });
  