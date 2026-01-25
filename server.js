const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import transformers for sentiment analysis
const { pipeline } = require('@xenova/transformers');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize sentiment analysis pipeline (lazy load)
let sentimentAnalyzer = null;

// Function to get sentiment analyzer (loaded once on first use)
async function getSentimentAnalyzer() {
    if (!sentimentAnalyzer) {
        console.log('🔄 Loading sentiment analysis model...');
        sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
        console.log('✅ Sentiment analysis model loaded');
    }
    return sentimentAnalyzer;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ollama configuration
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'llama3.2:latest';

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are an advanced AI assistant with the following capabilities:

1. **Conversational Understanding**: You understand context, intent, and can recognize important information.
2. **Sentiment Awareness**: You detect and respond appropriately to the user's emotional state.
3. **Helpful & Adaptive**: You learn from conversations and provide personalized responses.
4. **Professional**: You maintain a friendly yet professional tone.

Guidelines:
- Be concise but thorough
- Show empathy when detecting negative sentiment
- Provide structured responses when explaining complex topics
- Ask clarifying questions when needed
- Remember context from previous messages`;

// Utility functions
function analyzeSentiment(text) {
  const positiveWords = ["good", "great", "excellent", "happy", "love", "wonderful", "amazing", "thank", "thanks"];
  const negativeWords = ["bad", "terrible", "hate", "angry", "sad", "awful", "worst", "disappointed"];
  
  const textLower = text.toLowerCase();
  let posCount = 0, negCount = 0;
  
  positiveWords.forEach(word => {
    if (textLower.includes(word)) posCount++;
  });
  
  negativeWords.forEach(word => {
    if (textLower.includes(word)) negCount++;
  });
  
  if (posCount > negCount) return "😊 Positive";
  if (negCount > posCount) return "😟 Negative";
  return "😐 Neutral";
}

// Advanced sentiment analysis using pretrained model
async function analyzeSentimentWithML(text) {
  try {
    // Get the sentiment analyzer
    const classifier = await getSentimentAnalyzer();
    
    // Truncate text to 512 tokens (BERT limit)
    const truncatedText = text.substring(0, 512);
    
    // Get sentiment prediction
    const results = await classifier(truncatedText);
    
    if (!results || results.length === 0) {
      return analyzeSentiment(text); // Fallback to keyword analysis
    }
    
    const result = results[0];
    const label = result.label.toLowerCase();
    const score = result.score;
    
    // Map model outputs to emoji sentiment
    if (label.includes('positive') || label.includes('5 stars')) {
      return "😊 Positive";
    } else if (label.includes('negative') || label.includes('1 stars') || label.includes('2 stars')) {
      return "😟 Negative";
    } else {
      return "😐 Neutral";
    }
  } catch (error) {
    console.error('ML sentiment analysis error:', error.message);
    // Fallback to keyword-based analysis
    return analyzeSentiment(text);
  }
}

function extractEntities(text) {
  const entities = [];
  
  // Email pattern
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  emails.forEach(email => entities.push(`📧 ${email}`));
  
  // URL pattern
  const urls = text.match(/http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g) || [];
  urls.forEach(url => entities.push(`🔗 ${url}`));
  
  // Phone numbers
  const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
  phones.forEach(phone => entities.push(`📱 ${phone}`));
  
  return entities;
}

function detectIntent(message) {
  const messageLower = message.toLowerCase();
  
  if (["hello", "hi", "hey", "greetings"].some(word => messageLower.includes(word))) {
    return "greeting";
  } else if (["help", "support", "assist"].some(word => messageLower.includes(word))) {
    return "help_request";
  } else if (["thanks", "thank you", "appreciate"].some(word => messageLower.includes(word))) {
    return "gratitude";
  } else if (message.includes("?")) {
    return "question";
  }
  return "statement";
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    // Prepare the payload for Ollama
    const payload = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      stream: false,
      options: {
        temperature,
        top_p: 0.9,
        max_tokens: 800
      }
    };
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, payload, {
      timeout: 60000
    });
    
    res.json({ response: response.data.message.content });
  } catch (error) {
    console.error('Ollama API error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Could not connect to Ollama. Make sure it\'s running on http://localhost:11434' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }
    
    // Use ML-based sentiment analysis
    const sentiment = await analyzeSentimentWithML(text);
    const intent = detectIntent(text);
    const entities = extractEntities(text);
    
    res.json({ sentiment, intent, entities });
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Summarize conversation endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { messages, maxLength = 100 } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    // Format conversation for summarization
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    
    const summarizationPrompt = `Please provide a very brief (${maxLength} characters max) summary of this conversation. Be concise and capture the main topic:\n\n${conversationText}`;
    
    const payload = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that creates very brief, concise summaries of conversations. Keep summaries under the specified character limit.' },
        { role: 'user', content: summarizationPrompt }
      ],
      stream: false,
      options: {
        temperature: 0.3,
        max_tokens: 150
      }
    };
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, payload, {
      timeout: 30000
    });
    
    const summary = response.data.message.content.trim();
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error.message);
    // Return a fallback summary if ML fails
    res.json({ summary: 'Conversation recorded' });
  }
});

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Chatbot Frontend Server running on http://localhost:${PORT}`);
  console.log(`📡 Ollama API: ${OLLAMA_API_URL}`);
  console.log(`🤖 Model: ${MODEL_NAME}\n`);
});
