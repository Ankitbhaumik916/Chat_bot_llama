const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ✅ FIX: proper transformers import + env config
const { pipeline, env } = require('@xenova/transformers');

// Required for Node.js
env.allowLocalModels = true;
env.useBrowserCache = false;

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- SENTIMENT MODEL ----------------
let sentimentAnalyzer = null;

async function getSentimentAnalyzer() {
  if (!sentimentAnalyzer) {
    console.log('🔄 Loading sentiment analysis model...');
    sentimentAnalyzer = await pipeline(
      'sentiment-analysis',
      'Xenova/bert-base-multilingual-uncased-sentiment'
    );
    console.log('✅ Sentiment analysis model loaded');
  }
  return sentimentAnalyzer;
}

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- OLLAMA CONFIG ----------------
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'llama3.2';

// ⚠️ Ollama does NOT support max_tokens
// It uses num_predict instead
const SYSTEM_PROMPT = `You are an advanced AI assistant.
Be concise, empathetic, and structured.
Remember context and user intent.`;

// ---------------- UTILITIES ----------------
function analyzeSentimentFallback(text) {
  const pos = ["good", "great", "happy", "love", "excellent"];
  const neg = ["bad", "sad", "angry", "hate", "terrible"];

  const t = text.toLowerCase();
  let p = pos.filter(w => t.includes(w)).length;
  let n = neg.filter(w => t.includes(w)).length;

  if (p > n) return "😊 Positive";
  if (n > p) return "😟 Negative";
  return "😐 Neutral";
}

async function analyzeSentimentWithML(text) {
  try {
    const classifier = await getSentimentAnalyzer();

    // FIX: model expects text, not tokens; keep length reasonable
    const result = await classifier(text.slice(0, 1000));
    const label = result[0].label.toLowerCase();

    if (label.includes('positive') || label.includes('5')) return "😊 Positive";
    if (label.includes('negative') || label.includes('1') || label.includes('2')) return "😟 Negative";
    return "😐 Neutral";
  } catch (err) {
    console.error('Sentiment fallback:', err.message);
    return analyzeSentimentFallback(text);
  }
}

function detectIntent(text) {
  const t = text.toLowerCase();
  if (/hello|hi|hey/.test(t)) return "greeting";
  if (/help|support/.test(t)) return "help_request";
  if (/thanks|thank you/.test(t)) return "gratitude";
  if (text.includes('?')) return "question";
  return "statement";
}

// ---------------- CHAT ENDPOINT ----------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7 } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages[] required' });
    }

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
        num_predict: 800   // ✅ FIX
      }
    };

    const { data } = await axios.post(
      `${OLLAMA_API_URL}/api/chat`,
      payload,
      { timeout: 60000 }
    );

    res.json({ response: data.message?.content || '' });
  } catch (err) {
    console.error('Ollama error:', err.message);
    res.status(500).json({ error: 'Ollama request failed' });
  }
});

// ---------------- ANALYSIS ENDPOINT ----------------
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  res.json({
    sentiment: await analyzeSentimentWithML(text),
    intent: detectIntent(text)
  });
});

// ---------------- SUMMARY ENDPOINT ----------------
app.post('/api/summarize', async (req, res) => {
  try {
    const { messages } = req.body;

    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const payload = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: 'Summarize briefly.' },
        { role: 'user', content: conversation }
      ],
      stream: false,
      options: { temperature: 0.3, num_predict: 120 }
    };

    const { data } = await axios.post(`${OLLAMA_API_URL}/api/chat`, payload);
    res.json({ summary: data.message.content.trim() });
  } catch {
    res.json({ summary: 'Conversation recorded.' });
  }
});

// --------- VOICE-TO-TEXT ENDPOINT (Placeholder) ---------
app.post('/api/voice-to-text', async (req, res) => {
  try {
    // ⚠️ Note: This is a placeholder
    // For actual speech-to-text, you would need:
    // 1. Web Speech API (browser-side, works without backend)
    // 2. Google Cloud Speech-to-Text API
    // 3. AssemblyAI API
    // 4. Azure Speech Services
    
    // For now, return a placeholder response
    res.json({ text: 'Voice feature requires setup - use browser speech recognition instead' });
  } catch (err) {
    res.status(500).json({ error: 'Voice processing failed' });
  }
});

// --------- TEXT-TO-SPEECH ENDPOINT (Placeholder) ---------
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    
    // ⚠️ Note: Text-to-speech should be handled client-side with Web Speech API
    // For audio file generation, you'd need:
    // 1. Google Cloud Text-to-Speech API
    // 2. Azure Speech Services
    // 3. ElevenLabs API
    
    res.json({ audio: 'Use browser Web Speech API for TTS' });
  } catch (err) {
    res.status(500).json({ error: 'TTS processing failed' });
  }
});

// ---------------- HEALTH ----------------
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------------- SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Example fix for voice endpoint (commented out - use client-side instead)
// fetch('/api/chat', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
// })
// .then(res => {
//   if (!res.ok) throw new Error(`HTTP ${res.status}`);
//   return res.json();
// })
// .catch(err => console.error('Error:', err));
