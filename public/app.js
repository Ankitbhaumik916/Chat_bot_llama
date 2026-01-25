// State management
const state = {
    messages: [],
    conversationHistory: [],
    currentConversationId: null,
    savedConversations: [],
    isLoading: false,
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
    temperature: 0.7
};

// DOM Elements
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const temperatureSlider = document.getElementById('temperatureSlider');
const tempValue = document.getElementById('tempValue');
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

temperatureSlider.addEventListener('input', (e) => {
    state.temperature = parseFloat(e.target.value);
    tempValue.textContent = state.temperature.toFixed(1);
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
        
        // Auto-save conversation periodically (every 5 messages)
        if (state.messages.length % 10 === 0) {
            await saveCurrentConversation();
        }
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

    // Add feedback buttons for bot messages
    if (role === 'assistant') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.style.display = 'flex';
        feedbackDiv.style.gap = '8px';
        feedbackDiv.style.marginTop = '8px';
        feedbackDiv.style.paddingTop = '8px';
        feedbackDiv.style.borderTop = '1px solid rgba(0,0,0,0.1)';

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

        feedbackDiv.appendChild(thumbsUp);
        feedbackDiv.appendChild(thumbsDown);
        messageDiv.appendChild(feedbackDiv);
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
                    colors: ['#90EE90', '#FFB6C6', '#D3D3D3']
                }
            }
        ], {
            height: 200,
            margin: { l: 0, r: 0, t: 30, b: 0 },
            showlegend: true,
            font: { size: 10 }
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
                marker: { color: '#4CAF50' }
            }
        ], {
            height: 200,
            margin: { l: 80, r: 0, t: 0, b: 0 },
            xaxis: { title: '' },
            yaxis: { title: '' }
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
            fillcolor: 'rgba(76, 175, 80, 0.3)',
            line: { color: '#4CAF50', width: 2 }
        }
    ], {
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100],
                tickfont: { size: 9 }
            }
        },
        showlegend: false,
        height: 300,
        margin: { l: 40, r: 40, t: 40, b: 40 }
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
                line: { color: '#2196F3', width: 2 },
                marker: { size: 8 }
            }
        ], {
            title: 'Message Flow',
            xaxis: { title: '' },
            yaxis: { title: 'Count' },
            height: 250,
            margin: { l: 40, r: 20, t: 40, b: 20 }
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
                line: { color: '#FF9800', width: 2 },
                marker: { size: 8 },
                fill: 'tozeroy',
                fillcolor: 'rgba(255, 152, 0, 0.2)'
            }
        ], {
            title: 'Sentiment Trend',
            xaxis: { title: 'Message #' },
            yaxis: {
                title: 'Sentiment',
                tickvals: [-1, 0, 1],
                ticktext: ['Negative', 'Neutral', 'Positive']
            },
            height: 250,
            margin: { l: 40, r: 20, t: 40, b: 20 }
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
        // Generate summary of conversation
        const summary = await generateConversationSummary();
        
        const conversation = {
            id: state.currentConversationId,
            title: summary || 'Untitled Conversation',
            messages: state.messages,
            conversationHistory: state.conversationHistory,
            analytics: state.analytics,
            savedAt: new Date().toISOString(),
            messageCount: state.messages.length
        };
        
        // Save to localStorage
        let conversations = JSON.parse(localStorage.getItem('chatbot_conversations') || '[]');
        
        // Update or add conversation
        const existingIndex = conversations.findIndex(c => c.id === state.currentConversationId);
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
