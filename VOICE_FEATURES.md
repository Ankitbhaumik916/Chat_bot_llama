# Voice Features Documentation

## Overview
Your chatbot now supports complete voice conversation features including voice input (speech-to-text) and voice output (text-to-speech).

## Features Added

### 1. **Voice Input (Speech-to-Text)**
- **Microphone Button**: Click the 🎤 button next to the message input field
- **Recording**: Click the button to start recording, click again (⏹️) to stop
- **Auto-Send**: Recognized text is automatically sent to the chatbot
- **Real-time Feedback**: Visual feedback during recording with pulsing animation
- **Technology**: Uses Whisper AI model for accurate speech recognition

### 2. **Voice Output (Text-to-Speech)**
- **Voice Reply Button**: Each bot message has a 🔊 button to hear the response
- **Auto-Play Option**: Enable "Auto-play voice replies" in Settings to automatically hear all responses
- **Voice Speed Control**: Adjust voice speed from 0.5x to 2.0x in Settings
- **Web Speech API**: Uses browser's native speech synthesis for smooth audio output

### 3. **Voice Settings**
Located in the Settings panel on the right sidebar:
- **Auto-play voice replies**: Toggle to automatically speak all bot responses
- **Voice Speed**: Adjust playback speed (0.5x - 2.0x) - settings are saved locally
- Settings persist across sessions using localStorage

## How to Use

### Voice Input
1. Click the **🎤 microphone button** next to the text input
2. Allow microphone access when prompted by your browser
3. Speak your message clearly
4. The button changes to **⏹️** while recording
5. Click the **⏹️ button** to stop recording
6. The recognized text appears in the input field and is automatically sent

### Voice Output
**Option 1: Manual Voice Reply**
1. After the bot responds, look for the 🔊 button below the message
2. Click the 🔊 button to hear the response read aloud

**Option 2: Auto-Play Responses**
1. Go to **Settings** in the right sidebar
2. Check the "Auto-play voice replies" checkbox
3. All future bot responses will be automatically read aloud
4. You can still click the 🔊 button anytime to repeat

### Adjust Voice Speed
1. Go to **Settings** in the right sidebar
2. Use the "Voice Speed" slider to adjust (0.5x to 2.0x)
3. 1.0x is normal speed
4. Your preference is saved automatically

## Browser Compatibility

| Browser | Voice Input | Voice Output |
|---------|------------|--------------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Opera | ✅ | ✅ |

**Note**: Voice input requires Chromium-based or Firefox browser for best results.

## Technical Details

### Backend Support
- **Voice-to-Text API**: `/api/voice-to-text` - Accepts audio file upload and returns recognized text
- **Text-to-Speech API**: `/api/text-to-speech` - Validates text for speech synthesis

### Frontend Libraries
- **Web Speech API**: Browser-native API for speech recognition and synthesis
- **MediaRecorder API**: For audio recording
- **Whisper Model**: AI-powered speech recognition (via backend)

### Data Privacy
- Audio is processed in real-time and not stored
- Voice preferences are saved locally in your browser only
- No voice data is sent to external servers

## Troubleshooting

### Microphone not working
1. Check if your browser has microphone permission
2. Go to browser settings and enable microphone for this site
3. Test microphone in browser settings
4. Try refreshing the page

### Voice not being recognized
1. Speak clearly and slowly
2. Reduce background noise
3. Check microphone is working (test in another app)
4. Make sure the backend server is running

### Voice output not playing
1. Check browser volume is turned up
2. Verify speaker is working
3. Try clicking the 🔊 button again
4. Disable "Auto-play voice replies" and manually click button

### Lag or delay in voice output
1. Check your internet connection
2. Reduce voice speed if too fast
3. Close other browser tabs using audio
4. Restart the browser

## Advanced Features

### Keyboard Shortcuts
- **Ctrl+M or Cmd+M**: Start/stop voice recording (coming soon)
- **Ctrl+Space or Cmd+Space**: Repeat last bot message with voice (coming soon)

### Accessibility
- Voice features fully support screen readers
- All voice buttons have proper aria-labels
- Voice feedback is provided via notifications

## Configuration

### Server Configuration
If you want to use advanced voice features, update your `.env` file:

```env
# Optional voice service configuration
VOICE_LANGUAGE=en-US
VOICE_GENDER=female  # female or male
VOICE_RATE=1.0
```

### Frontend Configuration
Voice settings in `app.js`:
```javascript
state.voiceEnabled = false  // Auto-play disabled by default
state.voiceSpeed = 1.0      // Normal speed by default
```

## Future Enhancements
- Multi-language voice support
- Custom voice selection
- Emotion-aware voice generation
- Voice waveform visualization during recording
- Voice conversation history export
- Integration with voice assistants (Alexa, Google Assistant)

## API Endpoints

### POST /api/voice-to-text
Converts audio file to text
```json
Request: 
{
  "audio": <audio-file>
}

Response:
{
  "text": "recognized text",
  "confidence": 0.95
}
```

### POST /api/text-to-speech
Validates and prepares text for speech
```json
Request:
{
  "text": "text to speak"
}

Response:
{
  "message": "Text-to-speech ready",
  "useWebSpeechAPI": true
}
```

## Performance Metrics
- Voice recognition: ~1-3 seconds per message
- Voice output: Varies by message length
- Local storage: ~10KB for settings

## Support
For issues or feature requests, check:
1. Browser console for errors (F12)
2. Network tab to verify API calls
3. Microphone permissions in browser settings
4. Server logs for backend errors

---
**Last Updated**: January 2026
**Version**: 1.0
