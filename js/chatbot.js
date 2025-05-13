// Simple rule-based chatbot for troubleshooting and price queries
const troubleshootingTree = [
  {
    q: "Is your PC turning on at all?",
    a: [
      { t: "Yes", next: 1 },
      { t: "No", next: 2 }
    ]
  },
  {
    q: "Do you hear any beeps at boot?",
    a: [
      { t: "Yes", next: 3 },
      { t: "No", next: 4 }
    ]
  },
  {
    q: "Check your power supply and cables. Is the power LED on?",
    a: [
      { t: "Yes", next: 1 },
      { t: "No", end: "Check power source and PSU switch." }
    ]
  },
  {
    q: "How many beeps do you hear?",
    a: [
      { t: "1 short", end: "Normal POST. Check monitor connection." },
      { t: "Multiple", end: "Refer to motherboard beep codes. Likely RAM or GPU issue." }
    ]
  },
  {
    q: "Does the PC show anything on screen?",
    a: [
      { t: "Yes", end: "Check for OS or disk errors." },
      { t: "No", end: "Check GPU and RAM seating." }
    ]
  }
];

const initialOptions = {
  q: "Are you asking about the price of components or do you have a problem with your PC?",
  a: [
    { t: "Price", type: "price" },
    { t: "Problem", type: "problem" }
  ]
};

const problemOptions = [
  { t: "PC won't turn on", key: "power" },
  { t: "No display", key: "display" },
  { t: "Slow performance", key: "slow" },
  { t: "Overheating", key: "overheat" },
  { t: "Blue screen or crashes", key: "crash" }
];

let currentStep = null; // null means not in troubleshooting flow

function chatbotSend(msg, fromBot = false, suggestions = null) {
  const chat = document.getElementById('chatbot-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = (fromBot ? 'chatbot-msg bot' : 'chatbot-msg user') + ' chatbot-fadein';
  msgDiv.textContent = msg;
  chat.appendChild(msgDiv);

  // Add smart suggestions (quick replies)
  if (fromBot && suggestions && Array.isArray(suggestions) && suggestions.length) {
    const suggDiv = document.createElement('div');
    suggDiv.className = 'chatbot-suggestions chatbot-fadein';
    suggestions.forEach(sugg => {
      const btn = document.createElement('button');
      btn.className = 'chatbot-suggestion-btn chatbot-fadein';
      // Add icon for common suggestions
      if (/component|price/i.test(sugg)) {
        btn.innerHTML = '<i class="fas fa-microchip" style="margin-right:0.5em;"></i>' + sugg;
      } else if (/problem|troubleshoot/i.test(sugg)) {
        btn.innerHTML = '<i class="fas fa-tools" style="margin-right:0.5em;"></i>' + sugg;
      } else if (/support|contact/i.test(sugg)) {
        btn.innerHTML = '<i class="fas fa-headset" style="margin-right:0.5em;"></i>' + sugg;
      } else {
        btn.textContent = sugg;
      }
      btn.onclick = () => {
        chatbotSend(sugg);
        document.getElementById('chatbot-input').value = sugg;
        document.getElementById('chatbot-form').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      };
      suggDiv.appendChild(btn);
    });
    chat.appendChild(suggDiv);
  }

  chat.scrollTop = chat.scrollHeight;
  // Save to chat history
  saveChatHistory();
}



// Typing indicator logic
function showTypingIndicator() {
  const chat = document.getElementById('chatbot-messages');
  let typingDiv = document.getElementById('chatbot-typing');
  if (!typingDiv) {
    typingDiv = document.createElement('div');
    typingDiv.id = 'chatbot-typing';
    typingDiv.className = 'chatbot-msg bot';
    typingDiv.textContent = 'Bot is typing...';
    chat.appendChild(typingDiv);
  }
  chat.scrollTop = chat.scrollHeight;
}
function hideTypingIndicator() {
  const typingDiv = document.getElementById('chatbot-typing');
  if (typingDiv && typingDiv.parentNode) {
    typingDiv.parentNode.removeChild(typingDiv);
  }
}

// Chat history persistence
function saveChatHistory() {
  const chat = document.getElementById('chatbot-messages');
  const msgs = Array.from(chat.children).map(div => ({
    className: div.className,
    text: div.textContent
  }));
  localStorage.setItem('chatbotHistory', JSON.stringify(msgs));
}
function clearChatHistory() {
  localStorage.removeItem('chatbotHistory');
  const chat = document.getElementById('chatbot-messages');
  if (chat) chat.innerHTML = '';
}

function restoreChatHistory(reset = false) {
  const chat = document.getElementById('chatbot-messages');
  chat.innerHTML = '';
  if (reset) return;
  try {
    const msgs = JSON.parse(localStorage.getItem('chatbotHistory')) || [];
    msgs.forEach(m => {
      const msgDiv = document.createElement('div');
      msgDiv.className = m.className;
      msgDiv.textContent = m.text;
      chat.appendChild(msgDiv);
    });
    chat.scrollTop = chat.scrollHeight;
  } catch {}
}



function chatbotAsk(stepIdx) {
  const step = troubleshootingTree[stepIdx];
  if (!step) return;
  chatbotSend(step.q, true);
  const btns = document.getElementById('chatbot-buttons');
  btns.innerHTML = '';
  if (step.a && Array.isArray(step.a) && step.a.length) {
    step.a.forEach((ans, idx) => {
      const btn = document.createElement('button');
      btn.textContent = ans.t;
      btn.onclick = () => {
        chatbotSend(ans.t);
        if (ans.next !== undefined) {
          chatbotAsk(ans.next);
        } else if (ans.end) {
          chatbotSend(ans.end, true);
          btns.innerHTML = '';
        }
      };
      btns.appendChild(btn);
    });
  }
}

function chatbotHandleInput(input) {
  // Enhanced price query detection: matches 'price of CPU', 'price of AMD Ryzen 5 5600X', etc.
  const priceModelRegex = /price\s+of\s+([\w\s\-\d]+)$/i;
  const match = input.match(priceModelRegex);
  if (match) {
    const query = match[1].trim();
    fetch(`/api/component-price?name=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.price) {
          chatbotSend(`The price of ${query.toUpperCase()} is $${data.price}.`, true, [
            'Ask about another component',
            'Troubleshoot a problem',
            'Contact support'
          ]);
        } else {
          chatbotSend(`Sorry, I couldn't find the price for ${query}.`, true, [
            'Try another component',
            'Troubleshoot a problem',
            'Contact support'
          ]);
        }
      })
      .catch(() => chatbotSend('Error fetching price.', true));
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  // Add clear chat button to header
  const header = document.getElementById('chatbot-header');
  if (header && !document.getElementById('chatbot-clear')) {
    const clearBtn = document.createElement('button');
    clearBtn.id = 'chatbot-clear';
    clearBtn.title = 'Clear Chat';
    clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
    clearBtn.style.background = 'none';
    clearBtn.style.border = 'none';
    clearBtn.style.color = '#fff';
    clearBtn.style.fontSize = '1.1rem';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.marginLeft = '0.7rem';
    header.appendChild(clearBtn);
    clearBtn.onclick = () => {
      clearChatHistory();
      restoreChatHistory(true);
      if (typeof showInitialOptions === 'function') showInitialOptions();
    };
  }

  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const btns = document.getElementById('chatbot-buttons');
  const widget = document.getElementById('chatbot-widget');
  const toggle = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  let debounceTimeout = null;

  // Restore chat history
  restoreChatHistory();

  // Hide input by default
  form.style.display = 'none';

  // Show initial options
  function showInitialOptions() {
    chatbotSend(initialOptions.q, true);
    btns.innerHTML = '';
    initialOptions.a.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.t;
      btn.onclick = () => {
        chatbotSend(opt.t);
        if (opt.type === 'price') {
          chatbotSend('Please type your component price question, e.g., "price of AMD Ryzen 5 5600X".', true);
        } else if (opt.type === 'problem') {
          currentStep = 0;
          chatbotAsk(currentStep);
        }
        btns.innerHTML = '';
      };
      btns.appendChild(btn);
    });
  }

  // On widget open, show initial options
  widget.addEventListener('show', showInitialOptions);
  // If widget is already open on load:
  if (!widget.classList.contains('hidden')) showInitialOptions();


  // Show/hide logic
  if (toggle && widget) {
    toggle.onclick = () => {
      widget.style.display = (widget.style.display === 'none' || widget.style.display === '') ? 'flex' : 'none';
      if (widget.style.display === 'flex') {
        // Reset chat if opened
        document.getElementById('chatbot-messages').innerHTML = '';
        btns.innerHTML = '';
        chatbotSend('Hi! I am your troubleshooting assistant. Ask me about PC problems or component prices.', true);
        // Only show buttons, don't send the options as a bot message
        btns.innerHTML = '';
        form.style.display = 'none';
        initialOptions.a.forEach(opt => {
          const btn = document.createElement('button');
          btn.textContent = opt.t;
          btn.onclick = () => {
            chatbotSend(opt.t);
            if (opt.type === 'price') {
              chatbotSend('Please type your component price question, e.g., "price of AMD Ryzen 5 5600X".', true);
              form.style.display = '';
              input.focus();
              btns.innerHTML = '';
            } else if (opt.type === 'problem') {
              currentStep = 0;
              chatbotAsk(currentStep);
              form.style.display = 'none';
              // DO NOT clear btns.innerHTML here!
            }
          };
          btns.appendChild(btn);
        });
      }
    };
  }
  if (closeBtn && widget) {
    closeBtn.onclick = () => {
      widget.style.display = 'none';
      form.style.display = 'none';
    };
  }

  // Start with widget hidden
  if (widget) widget.style.display = 'none';

  // Chat logic
  // Only show greeting and buttons on load
  chatbotSend('Hi! I am your troubleshooting assistant. Ask me about PC problems or component prices.', true);
  btns.innerHTML = '';
  initialOptions.a.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.t;
    btn.onclick = () => {
      chatbotSend(opt.t);
      if (opt.type === 'price') {
        chatbotSend('Please type your component price question, e.g., "price of AMD Ryzen 5 5600X".', true);
        form.style.display = '';
        input.focus();
        btns.innerHTML = '';
      } else if (opt.type === 'problem') {
        // Show problem options
        btns.innerHTML = '';
        form.style.display = 'none';
        problemOptions.forEach(prob => {
          const probBtn = document.createElement('button');
          probBtn.textContent = prob.t;
          probBtn.onclick = () => {
            chatbotSend(prob.t);
            currentStep = 0; // For now, all problems use the same flow
            chatbotAsk(currentStep);
            btns.innerHTML = '';
          };
          btns.appendChild(probBtn);
        });
      }
    };
    btns.appendChild(btn);
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    // Debounce input: disable for 1s
    input.disabled = true;
    setTimeout(() => { input.disabled = false; }, 1000);
    chatbotSend(val);
    input.value = '';
    // Show typing indicator
    showTypingIndicator();
    // Simulate bot processing delay
    await new Promise(res => setTimeout(res, 650));
    hideTypingIndicator();
    // Handle price query
    if (chatbotHandleInput(val)) return;
    // If in troubleshooting flow, continue
    if (currentStep !== null) {
      // Ignore freeform input, only allow button selection
      chatbotSend('Please use the provided options.', true);
      return;
    }
    // If not in flow, prompt user again
    showInitialOptions();
  });
});
