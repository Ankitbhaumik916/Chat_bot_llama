# AI Chatbot Frontend

A modern Node.js-based frontend for an advanced AI chatbot powered by Llama 3.2.

## Features

✨ **Active Features**
- 🧠 NLP Understanding (Intent Recognition, Entity Extraction, Context Awareness)
- 😊 Sentiment Analysis (Real-time emotion detection, Adaptive responses)
- 📈 Smart Analytics (Live conversation tracking, Sentiment breakdown, Intent analysis)
- 🔄 Self-Learning (Conversation storage, Feedback collection, Adaptive responses)
- 🤖 AI Capabilities (Context-aware responses, Multi-turn conversations)

## Architecture

- **Backend**: Node.js/Express server
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Charts**: Plotly.js
- **AI Engine**: Ollama with Llama 3.2 model
- **API**: RESTful endpoints

## Setup

### Prerequisites
- Node.js (v14+)
- Python (for the original chatbot backend, optional)
- Ollama running on `http://localhost:11434`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```
PORT=3000
OLLAMA_API_URL=http://localhost:11434
MODEL_NAME=llama3.2:latest
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
chatb/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   └── app.js          # Frontend logic
├── server.js           # Express server
├── package.json        # Node.js dependencies
├── chatbot.py          # Original Python chatbot (optional)
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## API Endpoints

### POST `/api/chat`
Send a message to the chatbot.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?"
}
```

### POST `/api/analyze`
Analyze text for sentiment, intent, and entities.

**Request:**
```json
{
  "text": "Great job! I love this."
}
```

**Response:**
```json
{
  "sentiment": "😊 Positive",
  "intent": "gratitude",
  "entities": ["📧 example@email.com"]
}
```

### GET `/api/health`
Check server health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-25T10:30:00.000Z"
}
```

## Features

### Chat Interface
- Real-time message display
- Sentiment detection with emoji indicators
- Entity extraction (emails, URLs, phone numbers)
- Feedback buttons (👍👎) for user ratings

### Analytics Dashboard
- Live conversation metrics
- Sentiment distribution pie chart
- Intent detection bar chart
- User satisfaction tracking

### Advanced Analytics
- AI capabilities radar chart
- Conversation flow analysis
- Sentiment trend tracking
- Challenge & solution reference
- Future enhancements roadmap

### Settings
- Adjustable response creativity (temperature slider)
- Conversation export to JSON
- Clear chat history
- Reset analytics

## Usage

1. **Type a message** in the chat input field
2. **Press Enter** or click **Send** button
3. The AI analyzes your message for sentiment and intent
4. The chatbot responds with context-aware conversation
5. **View analytics** in real-time on the right panel
6. **Export conversations** anytime for later review

## Temperature Setting

- **Low (0.0)**: More focused, deterministic responses
- **High (1.0)**: More creative, varied responses
- **Default (0.7)**: Balanced creativity and coherence

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Connection Error
- Ensure Ollama is running: `ollama serve`
- Check if Ollama is accessible at `http://localhost:11434`
- Verify the model is installed: `ollama pull llama3.2:latest`

### No responses from AI
- Check Ollama service status
- Verify model name in `.env` file
- Check browser console for error messages

### Charts not displaying
- Ensure Plotly.js CDN is accessible
- Check browser console for JavaScript errors

## Performance Tips

- Close unused browser tabs to free up memory
- Use lower temperature values for faster responses
- Clear chat history if application becomes slow

## Future Enhancements

🚀 Planned Features:
- 🎤 Voice-enabled chatbot with speech-to-text
- 🌍 Multilingual support (50+ languages)
- 🔮 AI predictive suggestions
- 📱 Mobile app integration
- 🤝 Multi-platform deployment (WhatsApp, Slack, Telegram)
- 🧠 Advanced context memory

## License

MIT

## Support

For issues or questions, please check:
1. Browser console for errors
2. Server logs in terminal
3. Ollama service status
