# Voice Features Setup Guide

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 1b. (Optional) Install Realtime Voice Service
```bash
pip install -r requirements.txt
```

Download models and update [voice_config.json](voice_config.json):
- Vosk model (STT)
- Piper executable + voice model (TTS)

This will install the new `multer` package required for audio file handling.

### 2. Ensure Backend is Running
Make sure your Ollama server is running:
```bash
ollama serve
```

If you want realtime local voice:
```bash
python voice_server.py
```

### 3. Start the Chatbot Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will run on `http://localhost:3000`

### 4. Open in Browser
Navigate to `http://localhost:3000` in your web browser

## Testing Voice Features

### Test Voice Input
1. Click the 🎤 microphone button
2. Say: "Hello, how are you?"
3. Listen for confirmation sound
4. Message should appear in input field and send automatically

### Test Realtime Voice (Local)
1. Enable "Realtime voice (local)" in Settings
2. Click 🎤 and speak
3. Stop speaking and click 🎤 again
4. Bot response should play through the local Piper voice

### Test Voice Output
1. After receiving a bot response
2. Look for the 🔊 speaker button below the message
3. Click it to hear the response

### Test Settings
1. Scroll down to Settings panel
2. Toggle "Auto-play voice replies" 
3. Send a new message
4. Bot response should automatically be spoken

## System Requirements

### Browser
- Modern browser (Chrome, Firefox, Safari, Edge)
- Microphone connected
- Speakers or headphones

### Server
- Node.js 14+
- Ollama running on localhost:11434
- At least 4GB RAM for AI models

### Realtime Voice (Optional)
- Python 3.10+
- Vosk model files on disk
- Piper executable + voice model

## Troubleshooting Installation

### Port 3000 already in use
```bash
# Change port via environment variable
set PORT=3001
npm start
```

### Multer not found
```bash
npm install multer --save
```

### Microphone permission denied
- Click the permission prompt in browser
- Go to browser settings → Privacy & Security → Permissions → Microphone
- Allow microphone for localhost:3000

## Environment Configuration

Create or update `.env` file:

```env
PORT=3000
OLLAMA_API_URL=http://localhost:11434
MODEL_NAME=llama3.2:latest

# Optional voice settings
VOICE_LANGUAGE=en-US
VOICE_TIMEOUT=30000
```

## Verifying Installation

### Check Backend API
Open browser console and run:
```javascript
// Check voice-to-text endpoint
fetch('/api/voice-to-text', {
    method: 'POST',
    body: new FormData()
}).then(r => r.json()).then(console.log);

// Check text-to-speech endpoint
fetch('/api/text-to-speech', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text: 'Hello'})
}).then(r => r.json()).then(console.log);
```

### Check Frontend
In browser console, run:
```javascript
// Check if voice features are available
console.log('Voice enabled:', state.voiceEnabled);
console.log('Voice speed:', state.voiceSpeed);
console.log('Recording:', state.isRecording);
console.log('MediaRecorder available:', !!window.MediaRecorder);
console.log('SpeechSynthesis available:', !!window.speechSynthesis);
```

## Files Modified/Added

### New Files
- `VOICE_FEATURES.md` - Complete documentation
- `VOICE_SETUP.md` - This setup guide

### Modified Files
- `server.js` - Added voice API endpoints
- `public/app.js` - Added voice functionality
- `public/index.html` - Added voice UI controls
- `public/styles.css` - Added voice button styles
- `package.json` - Added multer dependency

### Unchanged Files
- `chatbot.py` - Python chatbot (optional)
- `requirements.txt` - Python dependencies (optional)
- `README.md` - Main documentation
- `CHANGELOG.md` - Version history
- `API_DOCUMENTATION.md` - API docs

## Quick Start Command

```bash
# One-liner to setup and run
npm install && npm start
```

Then open `http://localhost:3000` in your browser.

## Performance Tips

1. **For better speech recognition**
   - Speak clearly
   - Minimize background noise
   - Use a good quality microphone

2. **For smooth operation**
   - Close other resource-intensive applications
   - Use a modern browser
   - Ensure stable internet connection

3. **For battery/power saving**
   - Adjust voice speed slider to normal (1.0x)
   - Disable auto-play voice replies if not needed
   - Close browser when not in use

## Next Steps

1. Read [VOICE_FEATURES.md](./VOICE_FEATURES.md) for detailed usage
2. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API details
3. Review [README.md](./README.md) for general information

## Support & Issues

If you encounter problems:

1. **Check server logs**: Look for errors in terminal
2. **Check browser console**: F12 → Console tab
3. **Verify connections**: 
   - Is Ollama running?
   - Is server running on correct port?
   - Can you access http://localhost:3000?
4. **Test microphone**: Use browser microphone settings
5. **Check permissions**: Allow microphone in browser

## What's Included

✅ Voice input (speech-to-text)
✅ Voice output (text-to-speech)  
✅ Voice speed control
✅ Auto-play toggle
✅ Voice button UI
✅ Settings persistence
✅ Cross-browser support
✅ Full documentation

---

**Ready to use voice features!** 🎤🔊
