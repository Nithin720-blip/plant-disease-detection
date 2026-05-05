const form = document.getElementById('upload-form');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const previewSection = document.querySelector('.preview-section');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('result-section');
const errorMsg = document.getElementById('error-message');

// Helper function to format disease names
function formatDiseaseName(disease) {
    return disease
        .split('_')
        .filter(word => word.length > 0)  // Remove empty strings
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Chatbot variables
let currentDiseaseContext = "";
let chatHistory = [];

// Image preview
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewSection.style.display = 'block';
            resultSection.style.display = 'none';
            errorMsg.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!imageInput.files[0]) {
        showError('Please select an image first.');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    
    // UI state updates
    analyzeBtn.disabled = true;
    loading.style.display = 'block';
    resultSection.style.display = 'none';
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'An error occurred during analysis.');
        }
        
        // Display results dynamically
        document.getElementById('res-disease').textContent = formatDiseaseName(data.disease);
        
        // Update chatbot context
        currentDiseaseContext = formatDiseaseName(data.disease);
        document.getElementById('res-severity').textContent = `${data.severity}%`;
        document.getElementById('res-level').textContent = data.level;
        document.getElementById('res-spots').textContent = data.spots;
        
        // Change color based on severity level
        const levelElement = document.getElementById('res-level');
        if (data.level.toLowerCase() === 'high' || data.level.toLowerCase() === 'severe') {
            levelElement.style.color = '#ef4444'; // Red
        } else if (data.level.toLowerCase() === 'medium') {
            levelElement.style.color = '#f59e0b'; // Orange
        } else if (data.level.toLowerCase() === 'low' || data.level.toLowerCase() === 'mild') {
            levelElement.style.color = '#eab308'; // Yellow
        } else {
            levelElement.style.color = '#10b981'; // Green for healthy
        }
        
        // Handle Causes and Remedies section
        const infoSection = document.getElementById('info-section');
        const isHealthy = data.disease.toLowerCase().includes('healthy');
        
        if (isHealthy) {
            infoSection.style.display = 'none';
        } else {
            document.getElementById('res-causes').textContent = data.causes || 'Information not available.';
            document.getElementById('res-remedies').textContent = data.remedies || 'Information not available.';
            infoSection.style.display = 'block';
        }
        
        resultSection.style.display = 'block';
    } catch (err) {
        showError(err.message);
    } finally {
        analyzeBtn.disabled = false;
        loading.style.display = 'none';
    }
});

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

// =========================================
// EXPANDABLE & STRUCTURED CHATBOT LOGIC
// =========================================
const chatWidget = document.getElementById('chat-widget');
const chatHeader = document.getElementById('chat-header');
const chatToggleBtn = document.getElementById('chat-toggle');
const chatExpandBtn = document.getElementById('chat-expand');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

// Drag functionality variables
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let widgetStartX = 0;
let widgetStartY = 0;

// Handle Collapse/Minimize
chatToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chatWidget.classList.toggle('collapsed');
    
    // Update icons
    if (chatWidget.classList.contains('collapsed')) {
        chatToggleBtn.textContent = '▲';
        if(chatWidget.classList.contains('expanded')) {
            toggleExpandMode(); // Auto-close expand mode if minimizing
        }
    } else {
        chatToggleBtn.textContent = '▼';
    }
});

// Handle Expand/Maximize
function toggleExpandMode() {
    chatWidget.classList.toggle('expanded');
    
    // Swap SVG icons
    if (chatWidget.classList.contains('expanded')) {
        chatExpandBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>';
        // Center the expanded widget
        chatWidget.style.left = '50%';
        chatWidget.style.top = '50%';
        chatWidget.style.transform = 'translate(-50%, -50%)';
        chatWidget.style.right = 'auto';
        chatWidget.style.bottom = 'auto';
    } else {
        chatExpandBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
        // Reset to default position if not manually dragged
        if (!chatWidget.style.left || chatWidget.style.left === '50%') {
            chatWidget.style.left = 'auto';
            chatWidget.style.top = 'auto';
            chatWidget.style.right = '25px';
            chatWidget.style.bottom = '25px';
            chatWidget.style.transform = 'none';
        }
    }
}

chatExpandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (chatWidget.classList.contains('collapsed')) {
        chatWidget.classList.remove('collapsed');
        chatToggleBtn.textContent = '▼';
    }
    toggleExpandMode();
});

// Helper to get formatted time
function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(text, sender) {
    const time = getCurrentTime();
    const isUser = sender === 'user';
    
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper');
    if (isUser) wrapper.classList.add('user');
    
    if (isUser) {
        wrapper.innerHTML = `
            <div class="message-content">
                <span class="sender-name">You</span>
                <div class="message-bubble user-message"></div>
                <span class="message-time">${time}</span>
            </div>
            <div class="avatar user-avatar">👤</div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="message-content">
                <span class="sender-name">Agro AI</span>
                <div class="message-bubble ai-message"></div>
                <span class="message-time">${time}</span>
            </div>
        `;
    }
    
    const bubble = wrapper.querySelector('.message-bubble');
    if (sender === 'ai' && window.marked) {
        bubble.innerHTML = marked.parse(text);
    } else {
        bubble.textContent = text;
    }
    
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', 'ai');
    wrapper.id = 'typing-indicator';
    
    wrapper.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <span class="sender-name">Agro AI</span>
            <div class="message-bubble ai-message typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    
    chatHistory.push({ role: 'user', content: message });
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                context: currentDiseaseContext,
                history: chatHistory.slice(0, -1)
            })
        });

        const data = await response.json();
        removeTypingIndicator();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
        }

        appendMessage(data.response, 'ai');
        chatHistory.push({ role: 'model', content: data.response });

    } catch (err) {
        removeTypingIndicator();
        appendMessage("Error: " + err.message, 'ai');
    }
}

chatSend.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// =========================================
// DRAG FUNCTIONALITY FOR CHAT WIDGET
// =========================================

// Start dragging
chatHeader.addEventListener('mousedown', (e) => {
    // Don't start drag if clicking on buttons or if widget is expanded
    if (e.target.closest('.action-btn') || chatWidget.classList.contains('expanded')) return;
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = chatWidget.getBoundingClientRect();
    widgetStartX = rect.left;
    widgetStartY = rect.top;
    
    chatWidget.style.cursor = 'grabbing';
    chatWidget.style.userSelect = 'none';
    
    e.preventDefault();
});

// Stop dragging
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        chatWidget.style.cursor = '';
        chatWidget.style.userSelect = '';
    }
});

// Handle dragging
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    let newLeft = widgetStartX + deltaX;
    let newTop = widgetStartY + deltaY;
    
    // Constrain to viewport bounds
    const rect = chatWidget.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    chatWidget.style.left = newLeft + 'px';
    chatWidget.style.top = newTop + 'px';
    chatWidget.style.right = 'auto';
    chatWidget.style.bottom = 'auto';
    chatWidget.style.transform = 'none';
});