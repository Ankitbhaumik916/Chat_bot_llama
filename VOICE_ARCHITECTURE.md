# Voice Features Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ User Interface                                           │   │
│  │ ┌────────────────────────────────────────────────────┐  │   │
│  │ │ Chat Input Area                                    │  │   │
│  │ │ [Text Input] [🎤] [Send]                          │  │   │
│  │ │                                                    │  │   │
│  │ │ Chat History                                       │  │   │
│  │ │ - User: Hello!                                     │  │   │
│  │ │ - Bot: Hi there! [🔊] [👍] [👎]                  │  │   │
│  │ │                                                    │  │   │
│  │ │ Settings                                           │  │   │
│  │ │ □ Auto-play voice replies                         │  │   │
│  │ │ Voice Speed: [====●===] 1.0x                      │  │   │
│  │ └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Web APIs                                                 │   │
│  │ - MediaRecorder (Audio Capture)                         │   │
│  │ - Web Speech API (Synthesis)                            │   │
│  │ - Fetch API (HTTP Requests)                             │   │
│  │ - localStorage (Settings)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                    HTTP/HTTPS (Port 3000)
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                      Server (Backend)                            │
│                       Node.js/Express                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Endpoints                                            │   │
│  │ - POST /api/voice-to-text     (Speech Recognition)      │   │
│  │ - POST /api/text-to-speech    (TTS Ready)               │   │
│  │ - POST /api/chat              (Chat Messages)            │   │
│  │ - POST /api/analyze           (Sentiment Analysis)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Models                                                │   │
│  │ - Whisper (Speech Recognition)                          │   │
│  │ - Llama 3.2 (Chat via Ollama)                           │   │
│  │ - BERT (Sentiment Analysis)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Voice Input Flow Diagram

```
User → 🎤 Click → MediaRecorder Start → User Speaks → 🎤 Click to Stop
                                                              ↓
Audio Blob → FormData → POST /api/voice-to-text → Whisper AI Processing
                                                              ↓
Recognized Text ← Response JSON ← Backend Processing
                ↓
Text Input Field ← Auto-populate
                ↓
Auto-Send to Chat → POST /api/chat → Display Response
```

### Detailed Voice Input Steps

```
1. User clicks 🎤 button
   ↓
2. Browser requests microphone permission
   ↓
3. getUserMedia() called
   ↓
4. MediaRecorder initialized with audio stream
   ↓
5. state.isRecording = true
   ↓
6. UI updates: Button turns red, animation starts
   ↓
7. User speaks into microphone
   ↓
8. Audio data captured in chunks
   ↓
9. User clicks ⏹️ button
   ↓
10. mediaRecorder.stop() called
    ↓
11. Audio chunks assembled into Blob
    ↓
12. FormData created with audio file
    ↓
13. POST request to /api/voice-to-text
    ↓
14. Server processes with Whisper model
    ↓
15. Recognized text returned
    ↓
16. Text inserted into input field
    ↓
17. handleSendMessage() called automatically
    ↓
18. Chat flow continues normally
```

## Voice Output Flow Diagram

```
Bot Response Message → displayMessage('assistant', text)
                ↓
Create 🔊 button
                ↓
User clicks 🔊 OR Auto-play enabled
                ↓
speakMessage(text) called
                ↓
SpeechSynthesisUtterance created
                ↓
Set rate = state.voiceSpeed
                ↓
window.speechSynthesis.speak()
                ↓
Browser synthesizes voice
                ↓
Audio plays through speakers/headphones
```

### Detailed Voice Output Steps

```
1. Bot sends response
   ↓
2. displayMessage('assistant', content) called
   ↓
3. Message displayed in chat
   ↓
4. 🔊 button added to message
   ↓
5. If state.voiceEnabled = true:
   - Auto-play triggers after 500ms
   - speakMessage(content) called
   ↓
6. SpeechSynthesisUtterance created
   ↓
7. Set properties:
   - utterance.rate = state.voiceSpeed
   - utterance.pitch = 1
   - utterance.volume = 1
   ↓
8. window.speechSynthesis.speak(utterance)
   ↓
9. Browser's TTS engine processes text
   ↓
10. Audio synthesized and queued
    ↓
11. Audio plays through system audio output
    ↓
12. User hears voice response
    ↓
13. Can click 🔊 again to replay
```

## Settings Persistence Flow

```
Page Load
    ↓
init() called
    ↓
Check localStorage:
├─ 'voiceEnabled'
└─ 'voiceSpeed'
    ↓
Found? → Restore values to state and UI
    ↓
Update UI checkboxes/sliders
    ↓
User changes settings
    ↓
Event listeners trigger:
├─ voiceToggle.change → state.voiceEnabled = checked
│                     → localStorage.setItem()
└─ voiceSpeedSlider.input → state.voiceSpeed = value
                          → localStorage.setItem()
    ↓
Settings saved (persists on refresh)
```

## Error Handling Flow

```
Voice Feature
    ↓
Try Block
    ├─ Success → Normal Flow
    └─ Error → Catch Block
         ↓
    Error Type?
    ├─ Microphone Denied
    │  └─ showNotification('❌ Microphone access denied')
    ├─ No Speech Recognized
    │  └─ showNotification('❌ Could not recognize speech')
    ├─ Network Error
    │  └─ showNotification('❌ Connection error')
    └─ Unknown Error
       └─ showNotification('❌ ' + error.message)
         ↓
    Log error to console
         ↓
    User can retry
```

## State Management

```
state object
│
├─ Voice State
│  ├─ isRecording (boolean)
│  ├─ mediaRecorder (object)
│  ├─ audioChunks (array)
│  ├─ voiceEnabled (boolean) - localStorage
│  └─ voiceSpeed (number) - localStorage
│
├─ Chat State
│  ├─ messages (array)
│  ├─ conversationHistory (array)
│  ├─ isLoading (boolean)
│  └─ temperature (number)
│
└─ Analytics State
   ├─ totalMessages (number)
   ├─ sentiments (object)
   ├─ feedback (object)
   └─ conversationStart (date)
```

## API Call Sequence Diagram

```
Client                          Server                    AI Models
  │                               │                           │
  ├─ POST /api/voice-to-text ──→ │                           │
  │  (audio file)               │  ├─ Parse FormData       │
  │                             │  ├─ Load Whisper ────→ Whisper AI
  │                             │  │                        │
  │                             │  ← Process audio ←────── │
  │                             │  │                        │
  │  ← Response JSON ←─────────┤  │                        │
  │  {text, confidence}         │  │                        │
  │                             │  │                        │
  ├─ POST /api/chat ───────────→ │                           │
  │  (messages)                 │  ├─ Call Ollama ───→ Llama 3.2
  │                             │  │                        │
  │                             │  ← Get response ←────── │
  │                             │  │                        │
  │  ← Response JSON ←─────────┤  │                        │
  │  {response}                 │  │                        │
  │                             │  │                        │
  ├─ POST /api/analyze ────────→ │                           │
  │  (text)                     │  ├─ Call BERT ────→ BERT Model
  │                             │  │                        │
  │                             │  ← Analyze ←────────── │
  │                             │  │                        │
  │  ← Response JSON ←─────────┤  │                        │
  │  {sentiment, intent}        │  │                        │
```

## Local Storage Schema

```
localStorage
│
├─ 'voiceEnabled' (string: 'true' or 'false')
│  Usage: Save whether auto-play is enabled
│  
├─ 'voiceSpeed' (string: number like '1.0')
│  Usage: Save selected voice speed
│  
├─ 'chatbot_conversations' (JSON string)
│  Usage: Save all conversations (existing)
│  
└─ Other settings (existing)
```

## Dependency Tree

```
server.js
├─ express
├─ multer (NEW)
├─ axios
├─ cors
├─ dotenv
└─ @xenova/transformers

public/app.js
├─ window.navigator.mediaDevices (built-in)
├─ window.MediaRecorder (built-in)
├─ window.speechSynthesis (built-in)
├─ localStorage (built-in)
└─ fetch API (built-in)

public/index.html
└─ styles.css

public/styles.css
└─ CSS variables (custom properties)
```

## Feature Interaction Map

```
                    Chat System
                        │
         ┌──────────┬────┼────┬──────────┐
         ↓          ↓    ↓    ↓          ↓
     Analytics  Settings Voice Chat  History
         │          │      │     │       │
         ↓          ↓      ↓     ↓       ↓
    Sentiment   Speed   Input Output Records
    Feedback    Toggle  (STT) (TTS)
    Intent            Button Button
```

---

## Summary

The voice features integrate seamlessly with the existing chatbot:

1. **Input**: Captured via browser → Sent to server → Processed by AI → Text returned → Sent to chat
2. **Output**: Bot response → Displayed → Synthesized to speech → Played through speakers
3. **Settings**: Saved locally → Persisted across sessions → Applied globally
4. **Error Handling**: Graceful fallbacks → User notifications → Console logging
5. **Performance**: Non-blocking → Asynchronous → Real-time feedback

All features work together without interfering with existing functionality.
