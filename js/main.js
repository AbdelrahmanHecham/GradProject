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
   * Loads all component CSV files and calls callback() once all are done.
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
    // Select components in priority order
    const categories = ['cpu', 'gpu', 'ram', 'motherboard', 'case', 'psu', 'storage', 'cooler', 'monitor'];
    const budget = (window.userChoices && userChoices.budget) ? parseFloat(userChoices.budget) : 0;
    const purpose = (window.userChoices && userChoices.purpose) ? userChoices.purpose : null;
    let build = {};
    let totalCost = 0;
    let remainingBudget = budget;
    const TOP_N = 3; // Pick randomly from top 3 per category for some variety

    // --- CPU & Motherboard compatibility logic ---
    // 1. Pick CPU first (smart/random within budget)
    const cpuItems = (componentData['cpu'] || []).filter(item => parseFloat(item.price) <= remainingBudget);
    if (!cpuItems.length) {
      build['cpu'] = { model: 'No match', price: 0 };
      build['motherboard'] = { model: 'No match', price: 0 };
    } else {
      // Sort by purpose, pick randomly from top N
      cpuItems.sort((a, b) => (parseFloat(b[purpose]) || 0) - (parseFloat(a[purpose]) || 0));
      let cpuPick, mbPick, cpuSocket, cpuPrice, mbPrice;
      let foundCombo = false;
      for (let attempt = 0; attempt < 100 && !foundCombo; attempt++) {
        cpuPick = cpuItems[Math.floor(Math.random() * Math.min(TOP_N, cpuItems.length))];
        cpuSocket = cpuPick.socket || cpuPick.Socket || cpuPick.socket_type || '';
        cpuPrice = parseFloat(cpuPick.price) || 0;
        // Find motherboards with matching socket and affordable
        const mbItems = (componentData['motherboard'] || []).filter(mb => {
          const mbSocket = mb.socket || mb.Socket || mb.socket_type || '';
          const mbPriceVal = parseFloat(mb.price) || 0;
          return mbSocket === cpuSocket && (cpuPrice + mbPriceVal) <= remainingBudget;
        });
        if (mbItems.length) {
          mbItems.sort((a, b) => (parseFloat(b[purpose]) || 0) - (parseFloat(a[purpose]) || 0));
          mbPick = mbItems[Math.floor(Math.random() * Math.min(TOP_N, mbItems.length))];
          mbPrice = parseFloat(mbPick.price) || 0;
          build['cpu'] = cpuPick;
          build['motherboard'] = mbPick;
          totalCost += cpuPrice + mbPrice;
          remainingBudget -= cpuPrice + mbPrice;
          foundCombo = true;
        }
      }
      if (!foundCombo) {
        build['cpu'] = { model: 'No match', price: 0 };
        build['motherboard'] = { model: 'No match', price: 0 };
      }
    }

    // --- Other categories ---
    const otherCategories = categories.filter(cat => cat !== 'cpu' && cat !== 'motherboard');
    for (const category of otherCategories) {
      const items = componentData[category] || [];
      // Filter to those within remaining budget
      const affordable = items.filter(item => parseFloat(item.price) <= remainingBudget);
      if (affordable.length === 0) {
        build[category] = { model: 'No match', price: 0 };
        continue;
      }
      // Sort by selected purpose score (descending)
      affordable.sort((a, b) => (parseFloat(b[purpose]) || 0) - (parseFloat(a[purpose]) || 0));
      // Take top N, or fewer if not enough
      const topChoices = affordable.slice(0, TOP_N);
      // Pick randomly from top N
      const pick = topChoices[Math.floor(Math.random() * topChoices.length)];
      build[category] = pick;
      const price = parseFloat(pick.price) || 0;
      totalCost += price;
      remainingBudget -= price;
    }

    // Now hand off to your existing display logic in recommendations.html
    if (typeof displayResults === 'function') {
      displayResults(build, totalCost);
    } else {
      console.log('Build:', build, 'Total Cost:', totalCost);
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