// State management
const state = {
    messages: [],
    conversationHistory: [],
    currentConversationId: null,
    savedConversations: [],
    isLoading: false,
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    analytics: {
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        sentiments: {
            '😊 Positive': 0,
            '😟 Negative': 0,
            '😐 Neutral': 0
        },
        intents: {},
        feedback: {
            '👍': 0,
            '👎': 0
        },
        conversationStart: new Date()
    },
    temperature: 0.7,
    voiceEnabled: false,
    voiceSpeed: 1.0,
    realtimeVoiceEnabled: false,
    realtimeVoiceConnected: false,
    voiceSocket: null,
    audioContext: null,
    mediaStream: null,
    audioProcessor: null
};

// DOM Elements
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const temperatureSlider = document.getElementById('temperatureSlider');
const tempValue = document.getElementById('tempValue');
const voiceToggle = document.getElementById('voiceToggle');
const voiceSpeedSlider = document.getElementById('voiceSpeedSlider');
const voiceSpeedValue = document.getElementById('voiceSpeedValue');
const realtimeVoiceToggle = document.getElementById('realtimeVoiceToggle');
const realtimeStatus = document.getElementById('realtimeStatus');
const historySidebar = document.getElementById('historySidebar');
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const historySearch = document.getElementById('historySearch');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const container = document.querySelector('.container');
const clearChatBtn = document.getElementById('clearChatBtn');
const exportBtn = document.getElementById('exportBtn');
const resetAnalyticsBtn = document.getElementById('resetAnalyticsBtn');

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Voice input button
voiceInputBtn.addEventListener('click', toggleVoiceRecording);

// Voice settings
temperatureSlider.addEventListener('input', (e) => {
    state.temperature = parseFloat(e.target.value);
    tempValue.textContent = state.temperature.toFixed(1);
});

voiceToggle.addEventListener('change', (e) => {
    state.voiceEnabled = e.target.checked;
    localStorage.setItem('voiceEnabled', state.voiceEnabled);
});

voiceSpeedSlider.addEventListener('input', (e) => {
    state.voiceSpeed = parseFloat(e.target.value);
    voiceSpeedValue.textContent = state.voiceSpeed.toFixed(1) + 'x';
    localStorage.setItem('voiceSpeed', state.voiceSpeed);
});

realtimeVoiceToggle.addEventListener('change', async (e) => {
    state.realtimeVoiceEnabled = e.target.checked;
    localStorage.setItem('realtimeVoiceEnabled', state.realtimeVoiceEnabled);
    if (state.realtimeVoiceEnabled) {
        await connectRealtimeVoice();
    } else {
        disconnectRealtimeVoice();
    }
});

clearChatBtn.addEventListener('click', clearChat);
exportBtn.addEventListener('click', exportConversation);
resetAnalyticsBtn.addEventListener('click', resetAnalytics);

// History sidebar listeners
newChatBtn.addEventListener('click', startNewConversation);
toggleHistoryBtn.addEventListener('click', toggleHistorySidebar);
historySearch.addEventListener('input', filterHistoryList);
deleteAllBtn.addEventListener('click', deleteAllConversations);

// Main Chat Handler
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message || state.isLoading) return;

    // Disable input while loading
    state.isLoading = true;
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    userInput.value = '';
    userInput.focus();

    // Analyze user message
    const analysis = await analyzeMessage(message);
    const { sentiment, intent, entities } = analysis;

    // Update analytics
    state.analytics.totalMessages++;
    state.analytics.userMessages++;
    state.analytics.sentiments[sentiment]++;
    state.analytics.intents[intent] = (state.analytics.intents[intent] || 0) + 1;

    // Add to messages
    state.messages.push({ role: 'user', content: message });

    // Display user message
    displayMessage('user', message, sentiment, entities);

    // Show typing indicator
    displayTypingIndicator();

    // Get AI response
    const botMessage = await getBotResponse();
    
    // Remove typing indicator
    removeTypingIndicator();
    
    if (botMessage) {
        state.messages.push({ role: 'assistant', content: botMessage });
        state.analytics.totalMessages++;
        state.analytics.botMessages++;
        
        displayMessage('assistant', botMessage);

        // Store in conversation history
        state.conversationHistory.push({
            timestamp: new Date().toISOString(),
            user: message,
            bot: botMessage,
            sentiment,
            intent,
            entities
        });
        
        // Save after each exchange to ensure history is never lost
        await saveCurrentConversation();
    }

    // Re-enable input
    state.isLoading = false;
    userInput.disabled = false;
    sendBtn.disabled = false;

    // Update UI
    updateAnalytics();
    updateCharts();
    autoScroll();
}

// ================== VOICE FEATURES ==================

function updateRealtimeStatus(text, statusClass = '') {
    if (!realtimeStatus) return;
    realtimeStatus.textContent = text;
    realtimeStatus.classList.remove('connected', 'error');
    if (statusClass) {
        realtimeStatus.classList.add(statusClass);
    }
}

async function connectRealtimeVoice() {
    if (state.voiceSocket && state.voiceSocket.readyState === WebSocket.OPEN) {
        return;
    }

    updateRealtimeStatus('Local voice: connecting...');

    try {
        const socket = new WebSocket('ws://localhost:8765');
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
            state.realtimeVoiceConnected = true;
            updateRealtimeStatus('Local voice: connected', 'connected');
        };

        socket.onclose = () => {
            state.realtimeVoiceConnected = false;
            updateRealtimeStatus('Local voice: disconnected');
        };

        socket.onerror = () => {
            updateRealtimeStatus('Local voice: error', 'error');
            showNotification('❌ Realtime voice connection failed', 'error');
        };

        socket.onmessage = handleRealtimeMessage;
        state.voiceSocket = socket;
    } catch (error) {
        updateRealtimeStatus('Local voice: error', 'error');
        showNotification('❌ ' + error.message, 'error');
    }
}

function disconnectRealtimeVoice() {
    if (state.isRecording) {
        stopRealtimeRecording();
    }

    if (state.voiceSocket) {
        state.voiceSocket.close();
        state.voiceSocket = null;
    }

    state.realtimeVoiceConnected = false;
    updateRealtimeStatus('Local voice: disconnected');
}

function handleRealtimeMessage(event) {
    if (typeof event.data === 'string') {
        let payload;
        try {
            payload = JSON.parse(event.data);
        } catch (err) {
            return;
        }

        if (payload.type === 'partial') {
            userInput.placeholder = payload.text || 'Listening...';
        }

        if (payload.type === 'final') {
            const finalText = (payload.text || '').trim();
            userInput.placeholder = 'Type your message here...';
            if (finalText) {
                userInput.value = finalText;
                showNotification('✅ Voice recognized: "' + finalText + '"', 'success');
                setTimeout(() => handleSendMessage(), 300);
            } else {
                showNotification('❌ Could not recognize speech', 'error');
            }
        }

        if (payload.type === 'error') {
            showNotification('❌ ' + payload.message, 'error');
        }

        return;
    }

    if (event.data instanceof ArrayBuffer) {
        playRealtimeAudio(event.data);
    }
}

async function startRealtimeRecording() {
    if (!state.voiceSocket || state.voiceSocket.readyState !== WebSocket.OPEN) {
        showNotification('❌ Realtime voice service is not connected', 'error');
        return;
    }

    if (state.isRecording) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const silence = audioContext.createGain();
        silence.gain.value = 0;

        processor.onaudioprocess = (event) => {
            if (!state.voiceSocket || state.voiceSocket.readyState !== WebSocket.OPEN) return;
            const input = event.inputBuffer.getChannelData(0);
            const buffer = new Int16Array(input.length);

            for (let i = 0; i < input.length; i++) {
                let sample = Math.max(-1, Math.min(1, input[i]));
                buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            }

            state.voiceSocket.send(buffer.buffer);
        };

        source.connect(processor);
        processor.connect(silence);
        silence.connect(audioContext.destination);

        state.audioContext = audioContext;
        state.mediaStream = stream;
        state.audioProcessor = processor;
        state.isRecording = true;

        state.voiceSocket.send(JSON.stringify({ type: 'start', sampleRate: 16000 }));

        voiceInputBtn.style.background = '#D32F2F';
        voiceInputBtn.style.color = 'white';
        voiceInputBtn.style.animation = 'pulse 1s infinite';
        voiceInputBtn.textContent = '⏹️';
        userInput.disabled = true;
        sendBtn.disabled = true;
        showNotification('🎙️ Realtime listening... Click again to stop', 'info');
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    }
}

function stopRealtimeRecording() {
    if (!state.isRecording) return;

    if (state.voiceSocket && state.voiceSocket.readyState === WebSocket.OPEN) {
        state.voiceSocket.send(JSON.stringify({ type: 'end' }));
    }

    if (state.audioProcessor) {
        state.audioProcessor.disconnect();
        state.audioProcessor.onaudioprocess = null;
        state.audioProcessor = null;
    }

    if (state.mediaStream) {
        state.mediaStream.getTracks().forEach(track => track.stop());
        state.mediaStream = null;
    }

    if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
    }

    state.isRecording = false;
    voiceInputBtn.style.background = '';
    voiceInputBtn.style.color = '';
    voiceInputBtn.style.animation = 'none';
    voiceInputBtn.textContent = '🎤';
    userInput.disabled = false;
    sendBtn.disabled = false;
}

// Toggle voice recording
async function toggleVoiceRecording() {
    if (state.realtimeVoiceEnabled) {
        if (!state.realtimeVoiceConnected) {
            showNotification('🔌 Connecting local voice service...', 'info');
            await connectRealtimeVoice();
            return;
        }

        if (state.isRecording) {
            stopRealtimeRecording();
        } else {
            startRealtimeRecording();
        }
        return;
    }

    if (state.isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

// Start voice recording with Web Speech API
async function startVoiceRecording() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showNotification('❌ Speech Recognition not supported in your browser', 'error');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        state.isRecording = true;
        state.mediaRecorder = recognition; // Store reference
        
        // Update UI
        voiceInputBtn.style.background = '#D32F2F';
        voiceInputBtn.style.color = 'white';
        voiceInputBtn.style.animation = 'pulse 1s infinite';
        voiceInputBtn.textContent = '⏹️';
        userInput.disabled = true;
        sendBtn.disabled = true;
        showNotification('🎤 Listening... Click again to stop', 'info');
        
        let transcript = '';
        
        recognition.onstart = () => {
            console.log('Speech recognition started');
        };
        
        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptSegment = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcript += transcriptSegment + ' ';
                } else {
                    interim += transcriptSegment;
                }
            }
            // Show interim results
            if (interim) {
                userInput.placeholder = interim;
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showNotification('❌ ' + (event.error || 'Error recognizing speech'), 'error');
            state.mediaRecorder.stop();
        };
        
        recognition.onend = () => {
            console.log('Speech recognition ended');
            state.isRecording = false;
            if (transcript.trim()) {
                userInput.value = transcript.trim();
                userInput.placeholder = 'Type your message here...';
                showNotification('✅ Voice recognized: "' + transcript.trim() + '"', 'success');
                setTimeout(() => handleSendMessage(), 500);
            } else {
                showNotification('❌ Could not recognize speech', 'error');
            }
            // Reset UI
            voiceInputBtn.style.background = '';
            voiceInputBtn.style.color = '';
            voiceInputBtn.style.animation = 'none';
            voiceInputBtn.textContent = '🎤';
            userInput.disabled = false;
            sendBtn.disabled = false;
        };
        
        recognition.start();
    } catch (error) {
        console.error('Voice recording error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// Stop voice recording
function stopVoiceRecording() {
    if (state.mediaRecorder && state.isRecording) {
        try {
            if (state.mediaRecorder.stop) {
                state.mediaRecorder.stop();
            }
        } catch (err) {
            console.error('Error stopping recognition:', err);
        }
        state.isRecording = false;
    }
}

// Process voice recording (no longer needed, handled by onend event)
async function processVoiceRecording() {
    // This is now handled directly in the recognition.onend event
}

// Text-to-Speech using Web Speech API
function speakMessage(text) {
    if (state.realtimeVoiceEnabled && state.realtimeVoiceConnected) {
        requestRealtimeTts(text);
        return;
    }

    try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = state.voiceSpeed;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Text-to-speech error:', error);
    }
}

function requestRealtimeTts(text) {
    if (!state.voiceSocket || state.voiceSocket.readyState !== WebSocket.OPEN) {
        showNotification('❌ Realtime voice service is not connected', 'error');
        return;
    }

    state.voiceSocket.send(JSON.stringify({ type: 'tts', text }));
}

function playRealtimeAudio(buffer) {
    try {
        const blob = new Blob([buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => URL.revokeObjectURL(url));
    } catch (error) {
        console.error('Realtime audio playback error:', error);
    }
}

// ================== END VOICE FEATURES ==================

    // Update UI
    updateAnalytics();
    updateCharts();
    autoScroll();

// Analyze message (sentiment, intent, entities)
async function analyzeMessage(text) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Analysis error:', error);
    }

    return {
        sentiment: '😐 Neutral',
        intent: 'statement',
        entities: []
    };
}

// Get bot response
async function getBotResponse() {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: state.messages,
                temperature: state.temperature
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.response;
        } else {
            const error = await response.json();
            displayError(error.error || 'Unable to get response');
        }
    } catch (error) {
        displayError('Connection error: ' + error.message);
        console.error('Chat error:', error);
    }
    return null;
}

// Display message in chat
function displayMessage(role, content, sentiment = null, entities = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);

    // Add entities and sentiment for user messages
    if (role === 'user' && (sentiment || entities.length > 0)) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        if (sentiment) {
            metaDiv.textContent = `${sentiment}`;
        }

        messageDiv.appendChild(metaDiv);

        if (entities.length > 0) {
            const entitiesDiv = document.createElement('div');
            entitiesDiv.className = 'entities';
            entitiesDiv.textContent = `Detected: ${entities.join(', ')}`;
            messageDiv.appendChild(entitiesDiv);
        }
    }

    // Add feedback buttons and voice replay for bot messages
    if (role === 'assistant') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.style.display = 'flex';
        feedbackDiv.style.gap = '8px';
        feedbackDiv.style.marginTop = '8px';
        feedbackDiv.style.paddingTop = '8px';
        feedbackDiv.style.borderTop = '1px solid rgba(0,0,0,0.1)';
        feedbackDiv.style.flexWrap = 'wrap';

        // Voice replay button
        const voiceReplay = document.createElement('button');
        voiceReplay.textContent = '🔊';
        voiceReplay.title = 'Play message as voice';
        voiceReplay.style.padding = '6px 12px';
        voiceReplay.style.background = 'transparent';
        voiceReplay.style.border = '1px solid #1976D2';
        voiceReplay.style.borderRadius = '4px';
        voiceReplay.style.color = '#1976D2';
        voiceReplay.style.cursor = 'pointer';
        voiceReplay.style.fontWeight = '500';
        voiceReplay.style.fontSize = '13px';
        voiceReplay.style.transition = 'all 0.2s ease';
        voiceReplay.onmouseover = () => { voiceReplay.style.background = 'rgba(25,118,210,0.1)'; };
        voiceReplay.onmouseout = () => { voiceReplay.style.background = 'transparent'; };
        voiceReplay.onclick = () => {
            speakMessage(content);
        };

        const thumbsUp = document.createElement('button');
        thumbsUp.textContent = '👍';
        thumbsUp.style.padding = '6px 12px';
        thumbsUp.style.background = 'transparent';
        thumbsUp.style.border = '1px solid #00A651';
        thumbsUp.style.borderRadius = '4px';
        thumbsUp.style.color = '#00A651';
        thumbsUp.style.cursor = 'pointer';
        thumbsUp.style.fontWeight = '500';
        thumbsUp.style.fontSize = '13px';
        thumbsUp.style.transition = 'all 0.2s ease';
        thumbsUp.onmouseover = () => { thumbsUp.style.background = 'rgba(0,166,81,0.1)'; };
        thumbsUp.onmouseout = () => { thumbsUp.style.background = 'transparent'; };
        thumbsUp.onclick = () => {
            state.analytics.feedback['👍']++;
            showNotification('Thank you for the feedback!', 'success');
            updateAnalytics();
            thumbsUp.disabled = true;
            thumbsDown.disabled = true;
        };

        const thumbsDown = document.createElement('button');
        thumbsDown.textContent = '👎';
        thumbsDown.style.padding = '6px 12px';
        thumbsDown.style.background = 'transparent';
        thumbsDown.style.border = '1px solid #D32F2F';
        thumbsDown.style.borderRadius = '4px';
        thumbsDown.style.color = '#D32F2F';
        thumbsDown.style.cursor = 'pointer';
        thumbsDown.style.fontWeight = '500';
        thumbsDown.style.fontSize = '13px';
        thumbsDown.style.transition = 'all 0.2s ease';
        thumbsDown.onmouseover = () => { thumbsDown.style.background = 'rgba(211,47,47,0.1)'; };
        thumbsDown.onmouseout = () => { thumbsDown.style.background = 'transparent'; };
        thumbsDown.onclick = () => {
            state.analytics.feedback['👎']++;
            showNotification('Feedback recorded. We\'ll improve!', 'info');
            updateAnalytics();
            thumbsUp.disabled = true;
            thumbsDown.disabled = true;
        };

        feedbackDiv.appendChild(voiceReplay);
        feedbackDiv.appendChild(thumbsUp);
        feedbackDiv.appendChild(thumbsDown);
        messageDiv.appendChild(feedbackDiv);
        
        // Auto-play voice if enabled
        if (state.voiceEnabled) {
            setTimeout(() => speakMessage(content), 500);
        }
    }

    chatHistory.appendChild(messageDiv);
}

// Display typing indicator
function displayTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typing-indicator';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.display = 'flex';
    contentDiv.style.gap = '4px';
    contentDiv.style.alignItems = 'center';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.style.width = '6px';
        dot.style.height = '6px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = '#999';
        dot.style.animation = `pulse 1.4s infinite`;
        dot.style.animationDelay = `${i * 0.2}s`;
        contentDiv.appendChild(dot);
    }

    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);
    autoScroll();

    // Add CSS animation if not already present
    if (!document.getElementById('pulse-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-style';
        style.textContent = `
            @keyframes pulse {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Display error message
function displayError(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content error-message';
    contentDiv.textContent = '❌ Error: ' + message;

    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);
    autoScroll();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '14px 20px';
    notification.style.borderRadius = '6px';
    notification.style.fontSize = '13px';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '10000';
    notification.style.animation = 'slideInRight 0.3s ease';
    notification.style.maxWidth = '300px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    if (type === 'success') {
        notification.style.background = '#E8F5E9';
        notification.style.color = '#00A651';
        notification.style.border = '1px solid #00A651';
    } else if (type === 'error') {
        notification.style.background = '#FFEBEE';
        notification.style.color = '#D32F2F';
        notification.style.border = '1px solid #D32F2F';
    } else {
        notification.style.background = '#E3F2FD';
        notification.style.color = '#0066CC';
        notification.style.border = '1px solid #0066CC';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update analytics display
function updateAnalytics() {
    document.getElementById('totalMessages').textContent = state.analytics.totalMessages;
    document.getElementById('userMessages').textContent = state.analytics.userMessages;

    // Update feedback satisfaction
    const totalFeedback = state.analytics.feedback['👍'] + state.analytics.feedback['👎'];
    if (totalFeedback > 0) {
        const satisfaction = (state.analytics.feedback['👍'] / totalFeedback) * 100;
        document.getElementById('satisfactionBar').style.width = satisfaction + '%';
        document.getElementById('satisfactionText').textContent = `Satisfaction: ${satisfaction.toFixed(1)}%`;
    }
}

// Update charts
function updateCharts() {
    const chartTheme = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: '"Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
            color: '#0F172A'
        }
    };

    const baseAxis = {
        gridcolor: '#E5E7EB',
        zerolinecolor: '#E5E7EB',
        tickfont: { size: 11 }
    };

    // Sentiment Distribution Pie Chart
    const sentimentData = state.analytics.sentiments;
    if (Object.values(sentimentData).some(v => v > 0)) {
        Plotly.newPlot('sentimentChart', [
            {
                labels: Object.keys(sentimentData),
                values: Object.values(sentimentData),
                type: 'pie',
                hole: 0.4,
                marker: {
                    colors: ['#10B981', '#EF4444', '#CBD5E1']
                }
            }
        ], {
            ...chartTheme,
            height: 220,
            margin: { l: 0, r: 0, t: 32, b: 0 },
            showlegend: true,
            legend: { orientation: 'h', y: -0.2, font: { size: 11 } }
        }, { responsive: true });
    }

    // Intent Detection Bar Chart
    const intents = state.analytics.intents;
    if (Object.keys(intents).length > 0) {
        const intentEntries = Object.entries(intents).slice(0, 5);
        Plotly.newPlot('intentChart', [
            {
                y: intentEntries.map(e => e[0]),
                x: intentEntries.map(e => e[1]),
                type: 'bar',
                orientation: 'h',
                marker: { color: '#2563EB', opacity: 0.9, line: { color: '#1D4ED8', width: 1 } }
            }
        ], {
            ...chartTheme,
            height: 220,
            margin: { l: 90, r: 12, t: 20, b: 20 },
            xaxis: { ...baseAxis, title: '' },
            yaxis: { ...baseAxis, title: '' }
        }, { responsive: true });
    }

    // Radar Chart for AI Capabilities
    const capabilities = {
        'NLP Understanding': 85,
        'Sentiment Analysis': 80,
        'Response Quality': 90,
        'Context Awareness': 75,
        'Learning Ability': 70
    };

    Plotly.newPlot('radarChart', [
        {
            r: Object.values(capabilities),
            theta: Object.keys(capabilities),
            fill: 'toself',
            type: 'scatterpolar',
            name: 'Current Performance',
            fillcolor: 'rgba(37, 99, 235, 0.2)',
            line: { color: '#2563EB', width: 2 }
        }
    ], {
        ...chartTheme,
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100],
                tickfont: { size: 10 },
                gridcolor: '#E5E7EB',
                linecolor: '#E5E7EB'
            }
        },
        showlegend: false,
        height: 300,
        margin: { l: 30, r: 30, t: 30, b: 30 }
    }, { responsive: true });

    // Conversation Flow Analysis (if enough messages)
    if (state.conversationHistory.length > 5) {
        const messageNumbers = Array.from({ length: Math.min(10, state.conversationHistory.length) }, (_, i) => `Msg ${i + 1}`);
        
        Plotly.newPlot('flowChart', [
            {
                x: messageNumbers,
                y: Array.from({ length: messageNumbers.length }, (_, i) => i + 1),
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#2563EB', width: 2, shape: 'spline', smoothing: 1.2 },
                marker: { size: 8, color: '#1D4ED8' }
            }
        ], {
            ...chartTheme,
            title: 'Message Flow',
            xaxis: { ...baseAxis, title: '' },
            yaxis: { ...baseAxis, title: 'Count' },
            height: 240,
            margin: { l: 36, r: 16, t: 40, b: 28 }
        }, { responsive: true });

        // Sentiment Trend
        const sentimentMap = {
            '😊 Positive': 1,
            '😐 Neutral': 0,
            '😟 Negative': -1
        };

        const recentSentiments = state.conversationHistory
            .slice(-10)
            .map(conv => sentimentMap[conv.sentiment] || 0);

        Plotly.newPlot('sentimentTrendChart', [
            {
                x: Array.from({ length: recentSentiments.length }, (_, i) => i + 1),
                y: recentSentiments,
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#F59E0B', width: 2, shape: 'spline', smoothing: 1.1 },
                marker: { size: 7, color: '#F59E0B' },
                fill: 'tozeroy',
                fillcolor: 'rgba(245, 158, 11, 0.15)'
            }
        ], {
            ...chartTheme,
            title: 'Sentiment Trend',
            xaxis: { ...baseAxis, title: 'Message #' },
            yaxis: {
                ...baseAxis,
                title: 'Sentiment',
                tickvals: [-1, 0, 1],
                ticktext: ['Negative', 'Neutral', 'Positive']
            },
            height: 240,
            margin: { l: 40, r: 16, t: 40, b: 30 }
        }, { responsive: true });

        document.getElementById('flowAnalysisContainer').style.display = 'block';
    }
}

// Clear chat
function clearChat() {
    if (!confirm('Clear all messages? This action cannot be undone.')) return;
    
    state.messages = [];
    chatHistory.innerHTML = '';
    showNotification('Chat history cleared', 'success');
}

// Export conversation
function exportConversation() {
    if (state.conversationHistory.length === 0) {
        showNotification('No conversations to export', 'info');
        return;
    }

    const exportData = {
        metadata: {
            application: 'AI Chatbot Platform',
            version: '1.0.0',
            exportTime: new Date().toISOString(),
            conversationDuration: new Date(state.analytics.conversationStart).toISOString()
        },
        conversations: state.conversationHistory,
        analytics: {
            ...state.analytics,
            conversationStart: state.analytics.conversationStart.toISOString()
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Conversation exported successfully', 'success');
}

// Reset analytics
function resetAnalytics() {
    if (!confirm('Reset all analytics data? This cannot be undone.')) return;
    
    state.analytics = {
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        sentiments: {
            '😊 Positive': 0,
            '😟 Negative': 0,
            '😐 Neutral': 0
        },
        intents: {},
        feedback: {
            '👍': 0,
            '👎': 0
        },
        conversationStart: new Date()
    };
    state.conversationHistory = [];
    updateAnalytics();
    updateCharts();
    showNotification('Analytics reset successfully', 'success');
}

// Auto-scroll to latest message
function autoScroll() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Initialize
function init() {
    console.log('🤖 Chatbot Frontend initialized');
    
    // Load voice settings from localStorage
    const savedVoiceEnabled = localStorage.getItem('voiceEnabled');
    const savedVoiceSpeed = localStorage.getItem('voiceSpeed');
    const savedRealtimeVoiceEnabled = localStorage.getItem('realtimeVoiceEnabled');
    
    if (savedVoiceEnabled !== null) {
        state.voiceEnabled = savedVoiceEnabled === 'true';
        voiceToggle.checked = state.voiceEnabled;
    }
    
    if (savedVoiceSpeed !== null) {
        state.voiceSpeed = parseFloat(savedVoiceSpeed);
        voiceSpeedSlider.value = state.voiceSpeed;
        voiceSpeedValue.textContent = state.voiceSpeed.toFixed(1) + 'x';
    }

    if (savedRealtimeVoiceEnabled !== null) {
        state.realtimeVoiceEnabled = savedRealtimeVoiceEnabled === 'true';
        realtimeVoiceToggle.checked = state.realtimeVoiceEnabled;
    }

    if (state.realtimeVoiceEnabled) {
        connectRealtimeVoice();
    } else {
        updateRealtimeStatus('Local voice: disconnected');
    }
    
    loadSavedConversations();
    startNewConversation();
    updateAnalytics();
    userInput.focus();
    
    // Show a hint about the history sidebar
    setTimeout(() => {
        if (state.savedConversations.length > 0) {
            showNotification('💡 Click ☰ to view conversation history', 'info');
        }
    }, 2000);

    // Persist any in-progress chat before the tab closes
    window.addEventListener('beforeunload', () => {
        try {
            if (state.messages.length > 0) {
                const raw = localStorage.getItem('chatbot_conversations') || '[]';
                let conversations = JSON.parse(raw);
                const existingIndex = conversations.findIndex(c => c.id === state.currentConversationId);
                const conversation = {
                    id: state.currentConversationId,
                    title: conversations[existingIndex]?.title || 'Conversation',
                    messages: state.messages,
                    conversationHistory: state.conversationHistory,
                    analytics: state.analytics,
                    savedAt: new Date().toISOString(),
                    messageCount: state.messages.length
                };
                if (existingIndex >= 0) {
                    conversations[existingIndex] = conversation;
                } else {
                    conversations.unshift(conversation);
                }
                localStorage.setItem('chatbot_conversations', JSON.stringify(conversations.slice(0, 50)));
            }
        } catch (err) {
            console.error('beforeunload save failed', err);
        }
    });
}

// ===== Conversation Management Functions =====

// Generate unique conversation ID
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start a new conversation
function startNewConversation() {
    // Save current conversation if it has messages
    if (state.messages.length > 0) {
        saveCurrentConversation();
    }
    
    // Reset for new conversation
    state.currentConversationId = generateConversationId();
    state.messages = [];
    state.conversationHistory = [];
    chatHistory.innerHTML = '';
    
    // Reset analytics for new session
    state.analytics = {
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        sentiments: {
            '😊 Positive': 0,
            '😟 Negative': 0,
            '😐 Neutral': 0
        },
        intents: {},
        feedback: {
            '👍': 0,
            '👎': 0
        },
        conversationStart: new Date()
    };
    
    updateAnalytics();
    updateCharts();
    loadSavedConversations();
    userInput.focus();
    showNotification('Started new conversation', 'success');
}

// Save current conversation
async function saveCurrentConversation() {
    if (state.messages.length === 0) return;
    
    try {
        // Reuse existing title unless refreshing every 5 messages to reduce summary calls
        let conversations = JSON.parse(localStorage.getItem('chatbot_conversations') || '[]');
        const existingIndex = conversations.findIndex(c => c.id === state.currentConversationId);
        const existing = existingIndex >= 0 ? conversations[existingIndex] : null;

        let summary = existing?.title;
        if (!summary || state.messages.length % 5 === 0) {
            summary = await generateConversationSummary();
        }
        
        const conversation = {
            id: state.currentConversationId,
            title: summary || 'Untitled Conversation',
            messages: state.messages,
            conversationHistory: state.conversationHistory,
            analytics: state.analytics,
            savedAt: new Date().toISOString(),
            messageCount: state.messages.length
        };

        // Update or add conversation
        if (existingIndex >= 0) {
            conversations[existingIndex] = conversation;
        } else {
            conversations.unshift(conversation);
        }
        
        // Keep only last 50 conversations
        conversations = conversations.slice(0, 50);
        
        localStorage.setItem('chatbot_conversations', JSON.stringify(conversations));
        state.savedConversations = conversations;
        
        console.log('✅ Conversation saved');
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

// Generate conversation summary using AI
async function generateConversationSummary() {
    try {
        if (state.messages.length === 0) return 'New Conversation';
        
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: state.messages.slice(0, 10), // Use first 10 messages
                maxLength: 50
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.summary || 'Conversation';
        }
    } catch (error) {
        console.error('Error generating summary:', error);
    }
    
    // Fallback: Use first user message
    const firstUserMessage = state.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 50);
    }
    
    return 'Conversation';
}

// Load saved conversations
function loadSavedConversations() {
    try {
        const conversations = JSON.parse(localStorage.getItem('chatbot_conversations') || '[]');
        state.savedConversations = conversations;
        renderHistoryList(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Render history list
function renderHistoryList(conversations = state.savedConversations) {
    historyList.innerHTML = '';
    
    if (conversations.length === 0) {
        historyList.innerHTML = '<div style="padding: 20px 12px; text-align: center; color: var(--text-secondary); font-size: 12px;">No conversations yet</div>';
        return;
    }
    
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = `history-item ${conv.id === state.currentConversationId ? 'active' : ''}`;
        
        const date = new Date(conv.savedAt);
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <div class="history-item-title">${conv.title}</div>
            <div class="history-item-meta">
                <span>${conv.messageCount} messages</span>
                <button class="history-item-delete" data-id="${conv.id}">✕</button>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-item-delete')) {
                deleteConversation(conv.id);
                return;
            }
            loadConversation(conv.id);
            closeHistorySidebar();
        });
        
        historyList.appendChild(item);
    });
}

// Load a conversation
async function loadConversation(conversationId) {
    const conversation = state.savedConversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Save current if needed
    if (state.messages.length > 0 && state.currentConversationId !== conversationId) {
        await saveCurrentConversation();
    }
    
    // Load the conversation
    state.currentConversationId = conversation.id;
    state.messages = conversation.messages;
    state.conversationHistory = conversation.conversationHistory;
    state.analytics = conversation.analytics;
    
    // Render messages
    chatHistory.innerHTML = '';
    let historyIndex = 0;
    state.messages.forEach((msg) => {
        if (msg.role === 'user') {
            const userMsg = state.conversationHistory[historyIndex];
            displayMessage('user', msg.content, userMsg?.sentiment, userMsg?.entities);
            historyIndex++;
        } else {
            displayMessage('assistant', msg.content);
        }
    });
    
    updateAnalytics();
    updateCharts();
    loadSavedConversations();
    autoScroll();
    showNotification('Conversation loaded', 'success');
}

// Delete a conversation
function deleteConversation(conversationId) {
    if (!confirm('Delete this conversation?')) return;
    
    state.savedConversations = state.savedConversations.filter(c => c.id !== conversationId);
    localStorage.setItem('chatbot_conversations', JSON.stringify(state.savedConversations));
    
    if (state.currentConversationId === conversationId) {
        startNewConversation();
    } else {
        renderHistoryList();
    }
    
    showNotification('Conversation deleted', 'success');
}

// Delete all conversations
function deleteAllConversations() {
    if (!confirm('Delete ALL conversations? This cannot be undone.')) return;
    
    localStorage.setItem('chatbot_conversations', '[]');
    state.savedConversations = [];
    startNewConversation();
    showNotification('All conversations deleted', 'success');
}

// Toggle history sidebar
function toggleHistorySidebar() {
    historySidebar.classList.toggle('open');
    container.classList.toggle('sidebar-open');
}

// Close history sidebar
function closeHistorySidebar() {
    historySidebar.classList.remove('open');
    container.classList.remove('sidebar-open');
}

// Filter history list
function filterHistoryList() {
    const query = historySearch.value.toLowerCase();
    const filtered = state.savedConversations.filter(conv => 
        conv.title.toLowerCase().includes(query)
    );
    renderHistoryList(filtered);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
