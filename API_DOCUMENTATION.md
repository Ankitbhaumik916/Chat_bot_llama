# API Documentation

Complete API reference for the Advanced AI Chatbot backend.

## Base URL

```
http://localhost:3000
```

---

## Endpoints

### 1. Health Check

Check if the server and Ollama are running.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "ollamaConnected": true,
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

**Status Codes**:
- `200 OK` - Server and Ollama are running
- `503 Service Unavailable` - Ollama is not accessible

---

### 2. Chat

Send a message and receive an AI response with analytics.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "Hello, how are you?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "temperature": 0.7
}
```

**Parameters**:
- `message` (string, required) - User's message
- `conversationHistory` (array, optional) - Previous messages for context
- `temperature` (number, optional) - Response creativity (0.0-2.0, default: 0.7)

**Response**:
```json
{
  "response": "I'm doing well, thank you! How can I help you today?",
  "sentiment": {
    "label": "positive",
    "score": 0.85,
    "emoji": "😊"
  },
  "intent": "greeting",
  "entities": {
    "emails": [],
    "urls": [],
    "phones": []
  },
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

**Response Fields**:
- `response` (string) - AI-generated reply
- `sentiment` (object) - Sentiment analysis results
  - `label` (string) - Sentiment category: "very_positive", "positive", "neutral", "negative", "very_negative"
  - `score` (number) - Confidence score (0-1)
  - `emoji` (string) - Visual representation
- `intent` (string) - Detected intent: "greeting", "question", "help_request", "complaint", "feedback", "command", "statement"
- `entities` (object) - Extracted named entities
- `timestamp` (string) - ISO 8601 timestamp

**Status Codes**:
- `200 OK` - Successful response
- `400 Bad Request` - Missing or invalid message
- `500 Internal Server Error` - Ollama or server error

**Example Usage**:
```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the weather like?',
    temperature: 0.7
  })
});
const data = await response.json();
console.log(data.response);
```

---

### 3. Analyze Sentiment

Analyze sentiment of a text without generating a response.

**Endpoint**: `POST /api/analyze`

**Request Body**:
```json
{
  "text": "I love this chatbot! It's amazing!"
}
```

**Parameters**:
- `text` (string, required) - Text to analyze

**Response**:
```json
{
  "sentiment": {
    "label": "very_positive",
    "score": 0.95,
    "emoji": "😄"
  },
  "intent": "feedback",
  "entities": {
    "emails": [],
    "urls": [],
    "phones": []
  }
}
```

**Status Codes**:
- `200 OK` - Analysis complete
- `400 Bad Request` - Missing text
- `500 Internal Server Error` - Analysis failed

---

### 4. Summarize Conversation

Generate an AI-powered summary of a conversation.

**Endpoint**: `POST /api/summarize`

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the capital of France?"
    },
    {
      "role": "assistant",
      "content": "The capital of France is Paris."
    },
    {
      "role": "user",
      "content": "Tell me more about it."
    },
    {
      "role": "assistant",
      "content": "Paris is known for the Eiffel Tower, Louvre Museum..."
    }
  ]
}
```

**Parameters**:
- `messages` (array, required) - Conversation history to summarize

**Response**:
```json
{
  "summary": "User asked about France's capital and requested more information about Paris."
}
```

**Status Codes**:
- `200 OK` - Summary generated
- `400 Bad Request` - Missing or invalid messages
- `500 Internal Server Error` - Summarization failed

**Rate Limiting**:
- Summarization is computationally expensive
- Recommended to summarize only every 10+ messages
- Client-side caching recommended

---

## Data Models

### Message Object
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}
```

### Sentiment Object
```typescript
interface Sentiment {
  label: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  score: number; // 0-1
  emoji: string;
}
```

### Entities Object
```typescript
interface Entities {
  emails: string[];
  urls: string[];
  phones: string[];
}
```

### Analytics Object (Client-side)
```typescript
interface Analytics {
  sentiments: {
    positive: number;
    negative: number;
    neutral: number;
  };
  intents: {
    [key: string]: number;
  };
  messageCount: number;
  averageSentiment: number;
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Errors

#### 400 Bad Request
```json
{
  "error": "Message is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to get response from Ollama"
}
```

#### 503 Service Unavailable
```json
{
  "error": "Ollama is not running. Please start it with: ollama serve"
}
```

---

## ML Models

### BERT Sentiment Analysis

**Model**: `Xenova/bert-base-multilingual-uncased-sentiment`
**Framework**: Transformers.js (@xenova/transformers)

**Labels**:
- `1 star` → very_negative
- `2 stars` → negative
- `3 stars` → neutral
- `4 stars` → positive
- `5 stars` → very_positive

**Performance**:
- Accuracy: 90%+
- Processing time: ~500ms
- Fallback: Keyword-based analysis

### Intent Classification

**Method**: Keyword matching with priority ordering

**Intents** (priority order):
1. `greeting` - Hello, hi, hey, good morning
2. `help_request` - Help, assist, support, need
3. `question` - What, where, when, why, how, who
4. `complaint` - Problem, issue, wrong, error, bad
5. `feedback` - Love, hate, great, terrible, thanks
6. `command` - Please, can you, would you, show me
7. `statement` - Default fallback

---

## Rate Limits

No rate limiting currently implemented. For production:
- Recommended: 100 requests/minute per IP
- Burst: 20 requests/10 seconds
- Summarization: 10 requests/minute

---

## Authentication

Currently **no authentication** required. For production deployment:
- Implement JWT or OAuth2
- Add API key authentication
- Rate limiting per user

---

## CORS Policy

**Current**: Disabled (localhost development)
**Production**: Enable CORS with allowed origins:
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

## WebSocket Support

**Status**: Not implemented
**Future**: Real-time streaming responses via Socket.IO

Planned endpoint:
```javascript
socket.on('message', (data) => {
  // Stream AI response token by token
});
```

---

## Monitoring

### Health Check
Monitor server health at `/api/health` endpoint.

### Logs
Server logs include:
- Request timestamps
- Response times
- Error messages
- Sentiment analysis results

### Metrics
Track:
- Average response time
- Sentiment distribution
- Error rate
- Ollama connection status

---

## Development

### Testing Endpoints

Using **curl**:
```bash
# Health check
curl http://localhost:3000/api/health

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Analyze
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This is great!"}'

# Summarize
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}]}'
```

Using **Postman**:
1. Import collection from `postman_collection.json` (if provided)
2. Set base URL to `http://localhost:3000`
3. Test each endpoint

Using **JavaScript**:
```javascript
// See examples in public/app.js
// Functions: sendMessage(), analyzeMessage(), generateSummary()
```

---

## Dependencies

### Backend
- `express`: ^4.18.2 - Web framework
- `axios`: ^1.6.0 - HTTP client for Ollama
- `@xenova/transformers`: ^2.17.2 - ML models
- `cors`: ^2.8.5 - CORS middleware

### AI Services
- **Ollama**: localhost:11434 - LLM runtime
- **Model**: llama3.2 - Language model

---

## Changelog

### v2.0.0 (2026-01-26)
- Added ML-based sentiment analysis
- Added conversation summarization endpoint
- Improved intent detection
- Enhanced error handling

### v1.0.0 (2025-12-15)
- Initial API release
- Basic chat endpoint
- Keyword-based sentiment

---

**For more information, see [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md)**
