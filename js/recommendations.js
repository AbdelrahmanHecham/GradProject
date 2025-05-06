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

// Display recommendation results (updated to include icons)
function displayResults(build, totalCost) {
    const resultsSection = document.getElementById('results');
    const componentsList = document.getElementById('componentsList');
    
    componentsList.innerHTML = '';
    
    Object.keys(build).forEach(category => {
        const component = build[category];
        const categoryIcon = getCategoryIcon(category);
        
        const componentCard = document.createElement('div');
        componentCard.className = 'component-card';
        componentCard.innerHTML = `
            <h3><i class="${categoryIcon} component-icon"></i> ${component.manufacturer} ${component.model}</h3>
            <p><strong>Type:</strong> ${getCategoryName(category)}</p>
            <p><strong>Price:</strong> $${component.price}</p>
            ${component.performance ? `<p><strong>${userChoices.purpose} Performance:</strong> ${Math.round(component.performance[userChoices.purpose] * 10)}/10</p>` : ''}
        `;
        
        componentsList.appendChild(componentCard);
    });
    
    // Add cost summary
    const summaryCard = document.createElement('div');
    summaryCard.className = 'component-card';
    summaryCard.style.gridColumn = '1 / -1';
    summaryCard.innerHTML = `
        <h3><i class="fas fa-clipboard-list component-icon"></i> Build Summary</h3>
        <p><strong>Total Cost:</strong> $${totalCost}</p>
        <p><strong>Purpose:</strong> ${getPurposeName(userChoices.purpose)}</p>
        <p><strong>Your Budget:</strong> $${userChoices.budget}</p>
    `;
    
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
        case: 'fas fa-desktop'
    };
    
    return icons[category] || 'fas fa-question-circle';
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
      const buildToSave = {
        build: window.currentBuild,
        totalCost: window.currentBuildTotalCost,
        purpose: window.userChoices.purpose,
        budget: window.userChoices.budget,
        preferences: window.userChoices.preferences
      };
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
