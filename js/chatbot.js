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

function chatbotSend(msg, fromBot = false) {
  const chat = document.getElementById('chatbot-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = fromBot ? 'chatbot-msg bot' : 'chatbot-msg user';
  msgDiv.textContent = msg;
  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
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
          chatbotSend(`The price of ${query.toUpperCase()} is $${data.price}.`, true);
        } else {
          chatbotSend(`Sorry, I couldn't find the price for ${query}.`, true);
        }
      })
      .catch(() => chatbotSend('Error fetching price.', true));
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const btns = document.getElementById('chatbot-buttons');
  const widget = document.getElementById('chatbot-widget');
  const toggle = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
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
  form.addEventListener('submit', e => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    chatbotSend(val);
    input.value = '';
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
