# Quick Reference - Voice Features

## 🎤 Voice Input (Speech-to-Text)

### How to Use
1. Click **🎤 button** next to text input
2. Allow microphone when prompted
3. **Speak clearly** into microphone
4. Click **⏹️ button** to stop
5. Text appears → Message auto-sends

### Requirements
- ✅ Microphone connected
- ✅ Modern browser
- ✅ Quiet environment (recommended)
- ✅ English speech (primary support)

### Keyboard Shortcut (Future)
- `Ctrl+M` / `Cmd+M` - Start/Stop recording

### Status Indicators
- 🎤 (purple) = Ready to record
- ⏹️ (red) = Currently recording
- ✅ = Speech recognized
- ❌ = Recognition failed

---

## 🔊 Voice Output (Text-to-Speech)

### How to Use - Manual
1. Bot sends response
2. Look for **🔊 button** below message
3. Click **🔊** to hear response

### How to Use - Auto-Play
1. Open **Settings** panel
2. Check **"Auto-play voice replies"**
3. All future responses auto-play
4. Can still click 🔊 to replay

### Adjust Speed
1. Go to **Settings**
2. Drag **"Voice Speed"** slider
3. Left (0.5x) = Slow | Right (2.0x) = Fast
4. Default = 1.0x (normal)

### Keyboard Shortcut (Future)
- `Ctrl+Space` / `Cmd+Space` - Repeat last message

---

## ⚙️ Settings

### Auto-play Voice Replies
```
Setting: Auto-play voice replies
Location: Settings → Checkbox
Default: Disabled (☐)
Effect: All bot responses read aloud immediately
Saves: Yes (across sessions)
```

### Voice Speed
```
Setting: Voice Speed
Location: Settings → Slider
Range: 0.5x to 2.0x
Default: 1.0x
Unit: Multiply factor
Saves: Yes (across sessions)
```

### How Settings Persist
- Saved to browser's localStorage
- Survive page refresh
- Survive browser restart (usually)
- Can be cleared in browser settings

---

## 🔧 Troubleshooting Quick Fixes

### Microphone Not Working
```
1. Check: Allow microphone permission
   → Browser menu → Settings → Privacy
   
2. Check: Microphone is connected
   → Test in system settings
   
3. Check: Browser has permission
   → Click permission prompt
   
4. Try: Refresh page (F5)
   
5. Try: Different browser
```

### Speech Not Recognized
```
1. Speak: Clearly and slowly
2. Check: Background noise low
3. Check: Microphone working (test elsewhere)
4. Try: Shorter sentences
5. Try: Different language dialect
```

### No Sound Output
```
1. Check: Speaker/headphones connected
2. Check: Volume turned up
3. Check: Browser not muted
   → Right-click tab → Unmute
4. Try: Another website's audio
5. Try: Different browser
```

### Settings Not Saving
```
1. Check: localStorage enabled
   → Browser settings
   
2. Check: Private/Incognito mode
   → Use normal window
   
3. Try: Clear browser cache
   → Ctrl+Shift+Delete
   
4. Try: Different browser
```

### Slow Performance
```
1. Close: Other browser tabs
2. Close: Other applications
3. Check: Internet connection speed
4. Try: Reduce voice speed to 1.0x
5. Try: Disable auto-play
6. Restart: Browser completely
```

---

## 📊 Status & Information

### Check Voice Features Active
Open browser console (F12) and type:
```javascript
// Check if features available
console.log({
    voiceEnabled: state.voiceEnabled,
    voiceSpeed: state.voiceSpeed,
    isRecording: state.isRecording,
    mediaRecorderSupported: !!window.MediaRecorder,
    speechSynthesisSupported: !!window.speechSynthesis
});
```

### Get Voice Settings
```javascript
// View current settings
localStorage.getItem('voiceEnabled');      // "true" or "false"
localStorage.getItem('voiceSpeed');        // "1.0" to "2.0"
```

### Reset Voice Settings
```javascript
// In browser console
localStorage.removeItem('voiceEnabled');
localStorage.removeItem('voiceSpeed');
location.reload();
```

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Install
```bash
npm install
```

### Step 2: Start Server
```bash
npm start
```
(Ensure Ollama is also running)

### Step 3: Open Browser
Navigate to: `http://localhost:3000`

### Step 4: Test Voice Input
1. Click 🎤 button
2. Say: "Hello"
3. Confirm text appears
4. Message sends

### Step 5: Test Voice Output
1. Receive bot response
2. Click 🔊 button
3. Listen to response
4. Adjust speed in Settings if needed

---

## 📱 Mobile & Tablet Support

| Device | Voice Input | Voice Output | Recommended |
|--------|------------|--------------|-------------|
| iPhone | ✅ (Safari) | ✅ | Yes |
| Android | ✅ (Chrome) | ✅ | Yes |
| iPad | ✅ (Safari) | ✅ | Yes |
| Desktop | ✅ | ✅ | Best |

**Note**: Some mobile browsers may request permissions differently

---

## 💾 Data & Storage

### What's Stored
- ✅ Voice settings (enabled, speed)
- ✅ Chat messages
- ✅ Conversation history
- ✅ Analytics data

### What's NOT Stored
- ❌ Audio files
- ❌ Voice recordings
- ❌ User credentials
- ❌ External data

### Privacy
- 🔒 All processing local/server-only
- 🔒 No third-party voice services
- 🔒 Microphone access browser-controlled
- 🔒 User can disable anytime

---

## 🎯 Common Tasks

### Enable Auto-Play Voices
1. Settings → Check "Auto-play voice replies"
2. Done! All responses auto-play

### Disable Auto-Play Voices
1. Settings → Uncheck "Auto-play voice replies"
2. Done! Click 🔊 manually if needed

### Speed Up Voice
1. Settings → Drag slider RIGHT
2. Speed increases (up to 2.0x)
3. Auto-saves

### Slow Down Voice
1. Settings → Drag slider LEFT
2. Speed decreases (down to 0.5x)
3. Auto-saves

### Record Voice Message
1. Click 🎤 button
2. Speak your message
3. Click ⏹️ to send
4. Message appears and sends

### Replay Bot Response
1. Find bot message with 🔊 button
2. Click 🔊 button
3. Voice plays at your speed setting
4. Click again to replay

---

## ⚡ Performance Tips

### For Better Results
- **Audio Input**: Speak clearly, minimize noise
- **Audio Output**: Use good speakers/headphones
- **Network**: Use stable WiFi or wired connection
- **Device**: Close unnecessary applications

### For Faster Processing
- Speak in short sentences
- Use standard English accent
- Keep browser updated
- Use modern device (recent CPU)

### For Smoother Experience
- Keep voice speed at 1.0x (default)
- Close other browser tabs
- Disable auto-play if not needed
- Restart browser if lag occurs

---

## 🔗 Additional Resources

| Document | Purpose |
|----------|---------|
| VOICE_FEATURES.md | Complete user guide |
| VOICE_SETUP.md | Installation guide |
| VOICE_ARCHITECTURE.md | Technical architecture |
| API_DOCUMENTATION.md | API endpoints |
| README.md | General info |

---

## 💡 Pro Tips

1. **Batch Recording**: Speak multiple sentences, then stop
2. **Speed Practice**: Start at 1.0x, adjust up gradually
3. **Quiet Time**: Record when background is quiet
4. **Feedback**: Use 👍👎 buttons to train system
5. **Settings**: Save your preferences early
6. **Shortcuts**: Use keyboard shortcuts when available
7. **Testing**: Test microphone in browser settings first
8. **Export**: Export conversations before clearing data

---

## 🆘 Still Need Help?

### Check These First
1. Browser console for errors (F12)
2. Network tab in DevTools (F12)
3. Browser permissions settings
4. Microphone system settings
5. Is server running? (http://localhost:3000)

### Common Error Messages
| Error | Solution |
|-------|----------|
| "Microphone access denied" | Allow permission in browser |
| "Could not recognize speech" | Speak clearly, reduce noise |
| "Connection error" | Check server running on port 3000 |
| "No audio output" | Check speaker/volume settings |
| "Settings not saving" | Enable localStorage, use normal window |

---

## 📋 Browser Compatibility

| Browser | Win | Mac | Linux | Mobile |
|---------|-----|-----|-------|--------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ❌ | ✅ | ❌ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Opera | ✅ | ✅ | ✅ | ✅ |
| IE 11 | ❌ | ❌ | ❌ | ❌ |

**✅** = Full support | **❌** = Not supported

---

**Last Updated**: January 28, 2026
**Version**: 1.0
**Quick Links**: 📚 Docs | 🐛 Issues | 💬 Support
