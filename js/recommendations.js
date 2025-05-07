// Mock software issues data (in a real app, this would come from a database)
const softwareIssues = {
    performance: [
        {
            id: 1,
            title: 'System Running Very Slow',
            questions: [
                {
                    text: 'Do you see any error messages when it slows down?',
                    answers: [
                        { text: 'Yes', next: 2 },
                        { text: 'No', next: 3 }
                    ]
                },
                {
                    id: 2,
                    text: 'What error message do you see?',
                    input: true,
                    next: 4
                },
                {
                    id: 3,
                    text: 'Is the slowness in specific programs or the whole system?',
                    answers: [
                        { text: 'Specific programs', next: 5 },
                        { text: 'Whole system', next: 6 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 4,
                    title: 'Specific Program Error',
                    steps: [
                        'Try reinstalling the program showing the error',
                        'Check for program updates',
                        'Search online for the error message including the program name'
                    ]
                },
                {
                    id: 5,
                    title: 'Slow Specific Programs',
                    steps: [
                        'Check the system requirements for the program',
                        'Close other unnecessary programs',
                        'Try reducing performance settings in the program'
                    ]
                },
                {
                    id: 6,
                    title: 'General System Slowness',
                    steps: [
                        'Open Task Manager to check resource usage',
                        'Run a virus scan',
                        'Uninstall unnecessary programs',
                        'Run Disk Check utility'
                    ]
                }
            ]
        }
    ],
    software: [
        {
            id: 7,
            title: 'Program Not Working or Crashing',
            questions: [
                {
                    text: 'Was the program working before and stopped now?',
                    answers: [
                        { text: 'Yes', next: 8 },
                        { text: 'No', next: 9 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 8,
                    title: 'Program Stopped Working',
                    steps: [
                        'Try restarting your computer',
                        'Check for program updates',
                        'Repair the program installation from Control Panel'
                    ]
                },
                {
                    id: 9,
                    title: 'New Program Not Working',
                    steps: [
                        'Check program compatibility with your OS',
                        'Verify system requirements',
                        'Try running the program as administrator'
                    ]
                }
            ]
        }
    ],
    hardware: [
        {
            id: 10,
            title: 'Noises or Overheating',
            questions: [
                {
                    text: 'Is the noise coming from CPU, GPU, or elsewhere?',
                    answers: [
                        { text: 'CPU/Fans', next: 11 },
                        { text: 'GPU', next: 12 },
                        { text: 'Elsewhere', next: 13 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 11,
                    title: 'CPU Fan Issues',
                    steps: [
                        'Open your PC and check if the fan is properly mounted',
                        'Clean dust from the fan and heatsink',
                        'Check fan settings in BIOS'
                    ]
                },
                {
                    id: 12,
                    title: 'GPU Issues',
                    steps: [
                        'Check if GPU fans are spinning',
                        'Clean dust from the GPU',
                        'Monitor temperatures using software like GPU-Z'
                    ]
                }
            ]
        }
    ]
};

// Variables to track troubleshooting state
let currentIssue = null;
let currentQuestion = null;
let userPath = [];

// Start troubleshooting process
function startTroubleshooting(issueType) {
    currentIssue = issueType;
    userPath = [];
    
    // Find the first question for the selected issue type
    const issue = softwareIssues[issueType][0];
    showQuestion(issue.questions[0]);
    
    document.querySelector('.troubleshooting-options').classList.add('hidden');
    document.getElementById('troubleshootingFlow').classList.remove('hidden');
}

// Display the current question
function showQuestion(question) {
    currentQuestion = question;
    const stepContainer = document.getElementById('currentStep');
    
    let questionHTML = `
        <div class="step-question">${question.text}</div>
        <div class="step-options">
    `;
    
    if (question.answers) {
        question.answers.forEach(answer => {
            questionHTML += `
                <div class="step-option" onclick="answerQuestion(${answer.next})">${answer.text}</div>
            `;
        });
    } else if (question.input) {
        questionHTML += `
            <input type="text" id="userInput" class="form-control" placeholder="Enter error message...">
            <button class="btn" onclick="submitInput(${question.next})">Submit</button>
        `;
    }
    
    questionHTML += `</div>`;
    stepContainer.innerHTML = questionHTML;
}

// Process user answer
function answerQuestion(nextStepId) {
    // If the current question expects input and the input is empty, prevent proceeding
    if (currentQuestion && currentQuestion.input) {
        const userInputElem = document.getElementById('userInput');
        if (userInputElem && !userInputElem.value.trim()) {
            alert('Please enter the required value to proceed.');
            return;
        }
    }
    userPath.push({
        question: currentQuestion.text,
        answer: event.target.textContent
    });
    // Find the next question
    const nextQuestion = findQuestionById(nextStepId);
    if (nextQuestion) {
        showQuestion(nextQuestion);
    } else {
        // If no next question, show solutions
        showSolutions(nextStepId);
    }
}

// Process text input from user
function submitInput(nextStepId) {
    const userInput = document.getElementById('userInput').value;
    
    if (!userInput.trim()) {
        alert('Please enter the error message');
        return;
    }
    
    userPath.push({
        question: currentQuestion.text,
        answer: userInput
    });
    
    showSolutions(nextStepId);
}

// Find question by ID
function findQuestionById(id) {
    for (const issueType in softwareIssues) {
        for (const issue of softwareIssues[issueType]) {
            for (const question of issue.questions) {
                if (question.id === id) {
                    return question;
                }
            }
        }
    }
    return null;
}

// Display recommended solutions
function showSolutions(solutionId) {
    let solutions = [];
    
    // Search for solutions in all issues
    for (const issueType in softwareIssues) {
        for (const issue of softwareIssues[issueType]) {
            if (issue.solutions) {
                for (const solution of issue.solutions) {
                    if (solution.id === solutionId) {
                        solutions.push(solution);
                    }
                }
            }
        }
    }
    
    if (solutions.length === 0) {
        solutions.push({
            title: 'No Specific Solution Found',
            steps: [
                'We couldn\'t find a specific solution based on your answers',
                'Try searching online with keywords from your issue',
                'Contact technical support for further assistance'
            ]
        });
    }
    
    // Display solutions
    const solutionsContainer = document.getElementById('solutionsList');
    solutionsContainer.innerHTML = '';
    
    solutions.forEach(solution => {
        const solutionElement = document.createElement('div');
        solutionElement.className = 'solution-item';
        
        let stepsHTML = '<ol>';
        solution.steps.forEach(step => {
            stepsHTML += `<li>${step}</li>`;
        });
        stepsHTML += '</ol>';
        
        solutionElement.innerHTML = `
            <h4>${solution.title}</h4>
            ${stepsHTML}
        `;
        
        solutionsContainer.appendChild(solutionElement);
    });
    
    // Show solutions section and hide flow
    document.getElementById('troubleshootingFlow').classList.add('hidden');
    document.getElementById('solutions').classList.remove('hidden');
}

// Reset troubleshooting process
function resetTroubleshooting() {
    document.getElementById('troubleshootingFlow').classList.add('hidden');
    document.getElementById('solutions').classList.add('hidden');
    document.querySelector('.troubleshooting-options').classList.remove('hidden');
    
    currentIssue = null;
    currentQuestion = null;
    userPath = [];
}

// Collect user feedback on solutions
function giveFeedback(feedback) {
    alert(`Thank you for your feedback! Marked as "${feedback === 'yes' ? 'helpful' : 'not helpful'}"`);
    resetTroubleshooting();
}

// Display recommendation results (updated to include icons and allow user selection)
function displayResults(build, totalCost) {
    const resultsSection = document.getElementById('results');
    const componentsList = document.getElementById('componentsList');
    componentsList.innerHTML = '';

    // For each category, show a dropdown for user selection
    Object.keys(componentData).forEach(category => {
        const items = componentData[category];
        const selectedModel = build[category]?.model;
        const categoryIcon = getCategoryIcon(category);

        const wrapper = document.createElement('div');
        wrapper.className = 'component-card';

        // Label and icon
        const label = document.createElement('label');
        let iconHtml;
        if (category === 'cooler' || category === 'cpu-cooler') {
            iconHtml = `<img src="data/SS/cpu-cooler.png" alt="CPU Cooler" style="width:48px;height:48px;vertical-align:middle;margin-left:-8px;margin-right:8px;">`;
        } else {
            iconHtml = renderCategoryIcon(category);
        }
        label.innerHTML = `${iconHtml} <strong>${category.toUpperCase()}</strong>`;
        wrapper.appendChild(label);

        // Input + datalist for search and selection
        const input = document.createElement('input');
        input.setAttribute('list', `datalist-${category}`);
        input.className = 'component-input';
        input.placeholder = '🔍 Search or enter value...';
        if (build[category]?.model) input.value = optionLabelForItem(build[category], category);

        const datalist = document.createElement('datalist');
        datalist.id = `datalist-${category}`;
        
        // Ensure unique options for all categories
        const uniqueLabels = new Set();
        const filteredItems = items.filter(item => {
            const label = optionLabelForItem(item, category);
            if (uniqueLabels.has(label)) return false;
            uniqueLabels.add(label);
            return true;
        });
        filteredItems.forEach(item => {
            let optionLabel = optionLabelForItem(item, category);
            const option = document.createElement('option');
            option.value = optionLabel;
            datalist.appendChild(option);
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(datalist);

        // Show details for the selected item
        const details = document.createElement('div');
        details.className = 'component-details';
        function updateDetailsInput(val) {
            let selected = items.find(i => val && optionLabelForItem(i, category) === val);
            details.innerHTML = selected ?
                `<div>Price: $${selected.price}</div>` +
                (selected.gaming ? `<div>Gaming: ${selected.gaming}</div>` : '') +
                (selected.work ? `<div>Work: ${selected.work}</div>` : '') +
                (selected.creation ? `<div>Creation: ${selected.creation}</div>` : '')
                : '<div>No details</div>';
        }
        function optionLabelForItem(item, category) {
            if (category === 'gpu') {
                let model = item.model || item.name || '';
                let chipset = item.chipset || '';
                let price = item.price;
                let words = (model + ' ' + chipset)
                    .split(/\s+/)
                    .filter(Boolean);
                let seen = new Set();
                let uniqueWords = words.filter(word => {
                    let lower = word.toLowerCase();
                    if (seen.has(lower)) return false;
                    seen.add(lower);
                    return true;
                });
                let label = uniqueWords.join(' ');
                return `${label} ($${price})`;
            } else if (category === 'power-supply' || category === 'psu') {
                let name = item.model || item.name || '';
                let type = item.type || '';
                let efficiency = item.efficiency || '';
                let wattage = item.wattage || '';
                return `${name} ${type} ${efficiency} ${wattage}`;
            } else if (category === 'storage' || category === 'internal-hard-drive') {
                let name = item.model || item.name || '';
                let capacityRaw = item.capacity || '';
                let type = item.type || '';
                let capacityFormatted = '';
                if (/^\d+$/.test(capacityRaw)) {
                    if (capacityRaw.length === 4) {
                        capacityFormatted = capacityRaw[0] + 'Tb';
                    } else {
                        capacityFormatted = capacityRaw + 'Gb';
                    }
                } else {
                    capacityFormatted = capacityRaw;
                }
                return `${name} ${capacityFormatted} ${type}`;
            } else if (category === 'ram' || category === 'memory') {
                let name = item.model || item.name || '';
                let modules = item.modules || '';
                let speed = item.speed || '';
                let speedShort = speed.slice(-4);
                let modulesFormatted = modules.replace(',', 'x');
                return `${name} (${modulesFormatted}) ${speedShort}MHz`;
            } else {
                return `${item.model} ($${item.price})`;
            }
        }
        // Always enable the dropdown initially, even if build[category] is 'No match'
        if (build[category] && (build[category].model === 'No match' || build[category].model === undefined)) {
            input.value = '';
        }
        input.disabled = false;
        input.addEventListener('input', function() {
            updateDetailsInput(input.value);
            // Update build and summary if a valid option is selected
            let selected = items.find(i => optionLabelForItem(i, category) === input.value);
            if (selected) {
                build[category] = selected;
                updateSummary();
            }
        });
        updateDetailsInput(input.value);
        wrapper.appendChild(details);

        // --- Buttons for submit/reset ---
        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '0.5rem';
        btnRow.style.marginTop = '0.3rem';
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit';
        submitBtn.className = 'component-btn submit-btn';
        submitBtn.type = 'button';
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.className = 'component-btn reset-btn';
        resetBtn.type = 'button';
        
        btnRow.appendChild(submitBtn);
        btnRow.appendChild(resetBtn);
        wrapper.appendChild(btnRow);

        // --- Button logic ---
        submitBtn.addEventListener('click', function() {
            let selected = items.find(i => optionLabelForItem(i, category) === input.value);
            if (selected) {
                build[category] = selected;
                updateDetailsInput(input.value);
                input.disabled = true;
                submitBtn.disabled = true;
                resetBtn.disabled = false;
                updateSummary(); // Instantly update summary after submit
            }
        });
        resetBtn.addEventListener('click', function() {
            input.value = '';
            details.innerHTML = '<div>No details</div>';
            build[category] = undefined;
            updateSummary();
            input.disabled = false;
            submitBtn.disabled = false;
            resetBtn.disabled = true;
        });
        // Initial state: reset is disabled until submit
        resetBtn.disabled = true;

        componentsList.appendChild(wrapper);
    });

    // Build summary card
    const summaryCard = document.createElement('div');
    summaryCard.style.gridColumn = '1 / -1';
    summaryCard.id = 'build-summary';
    // Make build accessible to all functions
    window.build = build;
    function updateSummary() {
        // Calculate total cost from current build
        const total = getSubmittedTotalCost();
        window.currentBuildTotalCost = total;
        const overBudget = total > userChoices.budget;
        summaryCard.innerHTML = `
            <h3><i class="fas fa-clipboard-list component-icon"></i> Build Summary</h3>
            <p><strong>Total Cost:</strong> <span id="totalCostValue" style="color:${overBudget ? '#e53935' : '#2196f3'};">$${total.toFixed(2)}</span></p>
            <p><strong>Purpose:</strong> ${getPurposeName(userChoices.purpose)}</p>
            <p><strong>Your Budget:</strong> $${userChoices.budget}</p>
        `;
        window.currentBuild = build;
        window.currentBuildTotalCost = total;
    }
    updateSummary();
    componentsList.appendChild(summaryCard);

    // Show results section and hide form
    document.querySelector('.recommendation-form').classList.add('hidden');
    resultsSection.classList.remove('hidden');
}

// Helper function to get category icons
function getCategoryIcon(category) {
    const icons = {
        cpu: 'fas fa-microchip',
        gpu: 'fas fa-gamepad',
        ram: 'fas fa-memory',
        storage: 'fas fa-hdd',
        motherboard: 'fas fa-microchip',
        psu: 'fas fa-plug',
        case: 'fas fa-desktop',
        cooler: 'fas fa-question-circle',
        monitor: 'fas fa-desktop' // Use the same icon as case
    };
    
    return icons[category] || 'fas fa-question-circle';
}

// Helper function to render category icons
function renderCategoryIcon(category) {
    // Use custom image for case, move slightly left with negative margin
    if (category === 'case') {
        return `<img src="data/SS/PC%20Case.png" alt="PC Case" style="width:48px;height:48px;vertical-align:middle;margin-left:-8px;margin-right:8px;">`;
    }
    // Use custom image for motherboard, smaller and with right margin
    if (category === 'motherboard') {
        return `<img src="https://cdn-icons-png.flaticon.com/512/2004/2004692.png" alt="Motherboard" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;">`;
    }
    const iconClass = getCategoryIcon(category);
    return `<i class="${iconClass} component-icon"></i>`;
}

// Helper function to get the display name for a purpose
function getPurposeName(purpose) {
    switch (purpose) {
        case 'gaming': return 'Gaming';
        case 'work': return 'Work';
        case 'creation': return 'Content Creation';
        default: return purpose || 'N/A';
    }
}

// Helper to get total cost from only submitted components
function getSubmittedTotalCost() {
    // Use window.build if local build is not in scope
    const usedBuild = typeof build !== 'undefined' ? build : window.build;
    let sum = 0;
    Object.keys(usedBuild).forEach(category => {
        const el = document.querySelector(`.component-card input[list="datalist-${category}"]`);
        if (el && el.disabled && usedBuild[category] && usedBuild[category].price) {
            sum += parseFloat(usedBuild[category].price) || 0;
        }
    });
    return sum;
}

// --- Restore Build functionality ---
document.addEventListener('DOMContentLoaded', function() {
  // Restore build if present in localStorage
  if (window.location.search.includes('restore=1')) {
    try {
      const restored = JSON.parse(localStorage.getItem('restoredBuild'));
      if (restored && typeof displayResults === 'function') {
        // Set userChoices and show build
        window.userChoices = window.userChoices || {};
        window.userChoices.purpose = restored.purpose;
        window.userChoices.budget = restored.budget;
        window.userChoices.preferences = restored.preferences;
        window.currentBuild = restored.build;
        window.currentBuildTotalCost = restored.totalCost;
        displayResults(restored.build, restored.totalCost);
        // Optionally, scroll to results
        setTimeout(() => {
          document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (e) {
      // Ignore restore errors
    }
    // Clean up
    localStorage.removeItem('restoredBuild');
  }

  // Existing Save Build logic
  const saveBtn = document.getElementById('saveBuildBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      // Try to get the current build and userChoices from the page context
      if (!window.currentBuild || !window.userChoices) {
        document.getElementById('saveStatus').textContent = 'No build to save.';
        return;
      }
      // Compose build object
      const buildToSave = window.currentBuild;
      console.log('DEBUG: Saving build', buildToSave);
      try {
        const res = await fetch('/api/builds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ build: buildToSave })
        });
        const json = await res.json();
        if (res.ok) {
          document.getElementById('saveStatus').textContent = 'Build saved!';
        } else if (res.status === 401) {
          document.getElementById('saveStatus').textContent = 'Please log in to save builds.';
        } else {
          document.getElementById('saveStatus').textContent = json.message || 'Failed to save build.';
        }
      } catch (e) {
        document.getElementById('saveStatus').textContent = 'Network error.';
      }
    });
  }
});

// Patch displayResults to save build context for saving
const origDisplayResults = window.displayResults;
window.displayResults = function(build, totalCost) {
  window.currentBuild = build;
  window.currentBuildTotalCost = totalCost;
  origDisplayResults(build, totalCost);
};