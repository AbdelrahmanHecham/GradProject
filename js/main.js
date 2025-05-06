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
          componentData[category] = data.filter(r => r.model && r.price);
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
  
      // Sort descending by the score matching the primary purpose
      // (assumes your CSVs have numeric columns named exactly 'gaming','work','creation')
      const sorted = affordable.sort((a, b) =>
        (parseFloat(b[userChoices.purpose]) || 0)
        - (parseFloat(a[userChoices.purpose]) || 0)
      );
  
      // Pick the top, or a placeholder if none matched
      const pick = sorted[0] || { model: 'No match', price: 0 };
      build[category] = pick;
      totalCost += parseFloat(pick.price) || 0;
    });
  
    // Now hand off to your existing display logic in recommendations.html
    // (which should render `build` and `totalCost` into that #results div)
    if (typeof displayResults === 'function') {
      displayResults(build, totalCost);
    } else {
      console.log('Build:', build, 'Total Cost:', totalCost);
    }
  }
  
  
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
      const finishBtn = document.querySelector('.next-btn');
      if (finishBtn) {
        finishBtn.disabled = true;
        loadAllComponents(() => {
          finishBtn.disabled = false;
          finishBtn.textContent = 'See Build';
          finishBtn.onclick = computeBuild;
        });
      }
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