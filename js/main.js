// === Component CSV Loading (Steps 1–2) ===
// Map each component category to its CSV URL
const componentFiles = {
    cpu:         '/data/cpu.csv',
    gpu:         '/data/video-card.csv',
    ram:         '/data/memory.csv',
    storage:     '/data/internal-hard-drive.csv',
    motherboard: '/data/motherboard.csv',
    psu:         '/data/power-supply.csv',
    case:        '/data/case.csv',
    cooler:      '/data/cpu-cooler.csv',
    monitor:     '/data/monitor.csv'
  };
  
  // Will hold parsed rows for each category
  const componentData = {};
  let filesLoaded  = 0;
  const totalFiles = Object.keys(componentFiles).length;
  
  /**
   * Loads all component CSVs via PapaParse,
   * stores parsed rows in `componentData`,
   * and calls callback() once all are done.
   */
  function loadAllComponents(callback) {
    Object.entries(componentFiles).forEach(([category, url]) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          // Accept both 'name', 'model', and 'productName' as model fields, and infer price from 'price' or 'memSize' if needed
          const normalized = data.map(row => {
            if (!row.model && row.name) row.model = row.name;
            if (!row.model && row.productName) row.model = row.productName;
            // Try to infer price if not present, e.g., from 'memSize' or other fields (fallback)
            if (!row.price && row.memSize) row.price = row.memSize; // fallback, not real price
            return row;
          });
          componentData[category] = normalized.filter(r => r.model && (r.price || r.price === 0));
          filesLoaded++;
          if (filesLoaded === totalFiles) {
            console.log('✅ All components loaded:', componentData);
            callback();
          }
        }
      });
    });
  }
  
  // === Step 3: Compute a PC build from userChoices + componentData ===
  function computeBuild() {
    if (!window.userChoices || !userChoices.purpose) {
      alert('Please complete the form first.');
      return;
    }
  
    const build = {};
    let totalCost = 0;
  
    // For each category, pick the highest–scoring, within-budget part
    Object.entries(componentData).forEach(([category, items]) => {
      // Filter by overall budget (you could refine this to per-part budgets)
      const affordable = items.filter(r =>
        parseFloat(r.price) <= userChoices.budget
      );

      // Sort by the selected purpose (gaming, work, creation)
      const sorted = affordable.sort((a, b) =>
        (parseFloat(b[userChoices.purpose]) || 0)
        - (parseFloat(a[userChoices.purpose]) || 0)
      );

      // Pick the top, or a placeholder if none matched
      const pick = sorted[0] || { model: 'No match', price: 0 };
      build[category] = pick;
      // DO NOT add to totalCost here, let displayResults handle cost based on submit buttons
    });

    // Now hand off to your existing display logic in recommendations.html
    // (which should render `build` and `totalCost` into that #results div)
    if (typeof displayResults === 'function') {
      displayResults(build, 0); // Start with 0, let UI handle cost
    } else {
      console.log('Build:', build, 'Total Cost:', 0);
    }
  }
  
  // Make computeBuild globally accessible for recommendations.html
  window.computeBuild = computeBuild;
  
  document.addEventListener('DOMContentLoaded', function() {
    // 1) Activate current nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
  
    // 2) Add hover effects
    document.querySelectorAll('.feature-card, .option-card, .learn-category')
      .forEach(el => {
        el.addEventListener('mouseenter', () => el.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)');
        el.addEventListener('mouseleave', () => el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)');
      });
  
    // 3) On the Recommendations page: disable the “See Build” button until CSVs load,
    //    then wire it to computeBuild()
    if (currentPage === 'recommendations.html') {
      const finishBtn = document.getElementById('seeBuildBtn');
      const errorDiv = document.createElement('div');
      errorDiv.id = 'csv-load-error';
      errorDiv.style.color = 'red';
      errorDiv.style.margin = '1rem 0';
      finishBtn?.parentNode?.insertBefore(errorDiv, finishBtn.nextSibling);
      finishBtn.disabled = true;
      loadAllComponents(() => {
        finishBtn.disabled = false;
        finishBtn.textContent = 'See Build';
        finishBtn.onclick = computeBuild;
        errorDiv.textContent = '';
      });
      setTimeout(() => {
        if (finishBtn.disabled) {
          errorDiv.textContent = 'Error: Failed to load hardware data (CSV files). Please check your connection or contact support.';
        }
      }, 5000);
    }
  
    // === Learn Page Search Functionality ===
    if (window.location.pathname.endsWith('learn.html')) {
      const searchInput = document.querySelector('.search-box input[type="text"]');
      const searchButton = document.querySelector('.search-btn');
      const allCards = Array.from(document.querySelectorAll('.category-card, .guide-card'));
      function filterCards() {
        const query = searchInput.value.trim().toLowerCase();
        allCards.forEach(card => {
          const text = card.textContent.toLowerCase();
          // Show if query is empty or the text contains the query as a substring
          card.style.display = (!query || text.includes(query)) ? '' : 'none';
        });
      }
      searchInput.addEventListener('input', filterCards);
      if (searchButton) searchButton.addEventListener('click', filterCards);
    }
  
    // === Embedded YouTube Modal Logic ---
    if (window.location.pathname.endsWith('learn.html')) {
      const videoModal = document.getElementById('video-modal');
      const youtubeIframe = document.getElementById('youtube-iframe');
      const closeBtn = document.getElementById('close-video');
      // Listen for clicks on category cards with data-video-id
      document.querySelectorAll('.category-card[data-video-id]').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
          const videoId = card.getAttribute('data-video-id');
          if (videoId) {
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            videoModal.style.display = 'flex';
          }
        });
      });
      // Listen for clicks on guide-btns inside guide-cards with data-video-id
      document.querySelectorAll('.guide-card[data-video-id] .guide-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent bubbling if guide-card also has click
          const card = btn.closest('.guide-card[data-video-id]');
          const videoId = card ? card.getAttribute('data-video-id') : null;
          if (videoId) {
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            videoModal.style.display = 'flex';
          }
        });
      });
      // Close modal logic
      closeBtn.addEventListener('click', function() {
        videoModal.style.display = 'none';
        youtubeIframe.src = '';
      });
      // Optional: close modal when clicking outside the video box
      videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) {
          videoModal.style.display = 'none';
          youtubeIframe.src = '';
        }
      });
    }
  });
  
  // === Utility functions (unchanged) ===
  function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;
    form.querySelectorAll('input[required], textarea[required]')
      .forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = '#e74c3c';
          isValid = false;
        } else {
          input.style.borderColor = '#ddd';
        }
      });
    return isValid;
  }
  
  function showStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step${stepNumber}`).classList.remove('hidden');
  }  