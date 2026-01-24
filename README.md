# 🤖 Advanced AI Chatbot with Llama 3.2

An intelligent conversational AI chatbot powered by **Llama 3.2** running locally via Ollama, featuring advanced NLP capabilities, real-time sentiment analysis, and comprehensive analytics dashboard.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.53+-red.svg)
![Llama](https://img.shields.io/badge/Llama-3.2-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Key Features

### 🧠 **NLP-Based Conversational Understanding**
- **Intent Recognition** - Automatically detects user intent (greetings, questions, help requests, etc.)
- **Named Entity Recognition (NER)** - Extracts emails, URLs, phone numbers from conversations
- **Contextual Memory** - Maintains conversation flow across multiple turns
- **Context-Aware Responses** - Enhanced system prompts for better understanding

### 😊 **Sentiment Analysis & Emotion Detection**
- Real-time sentiment detection (Positive, Negative, Neutral)
- Emotion-aware responses with empathy
- Adaptive reply generation based on user mood
- Sentiment tracking throughout conversations

### 🔄 **Self-Learning & Adaptive AI**
- Conversation history storage for learning
- User feedback collection system (👍/👎)
- Reinforcement learning foundation
- Automatic error handling with fallback mechanisms

### 📊 **Smart Analytics Dashboard**
- **Live Metrics** - Track messages, responses, and engagement
- **Interactive Visualizations**:
  - Sentiment distribution pie chart
  - Intent detection bar charts
  - Pentagonal radar chart for AI capabilities
  - Conversation flow analysis
  - Sentiment trend timeline
- **Performance Tracking** - Response time and accuracy metrics
- **User Feedback Analytics** - Satisfaction percentage with progress bars

### 🎯 **AI-Powered Response Generation**
- Powered by Llama 3.2 via Ollama
- Adjustable creativity/temperature slider
- Multi-turn conversation support
- Context-aware with enhanced system prompts
- Configurable response parameters

### 💾 **Additional Capabilities**
- Export conversations as JSON for future training
- Clear chat functionality
- Analytics reset option
- Local data storage (privacy-focused)
- Session duration tracking

## 🚧 Challenges & Proposed Solutions

| Challenge | Solution |
|-----------|----------|
| Understanding complex user queries | Use advanced NLP models like GPT & BERT |
| Handling multiple intents in one query | Implement intent prioritization algorithms |
| Real-time response optimization | Use WebSockets & Redis caching |
| Ensuring AI bias-free responses | Implement fair AI training & bias detection |

## 🚀 Future Enhancements

- 🎤 **Voice-enabled chatbot** with speech-to-text capabilities
- 🌍 **Multilingual support** for 50+ languages
- 🔮 **AI-based predictive suggestions** for better user interaction
- 📱 **Mobile app integration** (iOS & Android)
- 🤝 **Multi-platform deployment** (WhatsApp, Slack, Telegram, Discord, MS Teams)
- 🧠 **Advanced context memory** with long-term storage
- ⚡ **Real-time streaming responses**
- 🔐 **User authentication & personalization**

## 📋 Prerequisites

- Python 3.8 or higher
- [Ollama](https://ollama.ai/) installed and running
- Llama 3.2 model downloaded

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/Ankitbhaumik916/Chat_bot_llama.git
cd Chat_bot_llama
```

### 2. Create a virtual environment (optional but recommended)
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install streamlit requests plotly pandas
```

### 4. Install and run Ollama with Llama 3.2
```bash
# Download Llama 3.2
ollama pull llama3.2

# Start Ollama server (in a separate terminal)
ollama serve
```

## 🚀 Usage

### Start the chatbot
```bash
streamlit run chatbot.py
```

The application will open in your browser at `http://localhost:8501`

### Basic Commands
- Type your message in the chat input
- Click 👍 or 👎 to provide feedback on responses
- Use the **Settings** slider to adjust response creativity
- Click **Clear Chat** to start a new conversation
- Click **Export Conversation** to download chat history
- Click **Reset Analytics** to clear all metrics

## 📊 Dashboard Features

### Live Analytics Panel
- Real-time message counts
- Sentiment distribution visualization
- Top intent detection
- User satisfaction metrics

### Advanced Analytics
- **AI Capabilities Radar** - Pentagonal chart showing performance across 5 dimensions
- **Challenges & Solutions** - Expandable cards with technical insights
- **Future Enhancements** - Roadmap of planned features
- **Conversation Flow** - Timeline analysis of message patterns
- **Sentiment Trend** - Emotional journey visualization

## 🏗️ Project Structure

```
Chat_bot_llama/
├── chatbot.py              # Main application file
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── requirements.txt       # Python dependencies
├── Lib/                   # Python libraries (venv)
└── Scripts/               # Python executables (venv)
```

## 🔧 Configuration

### Adjusting AI Parameters

In the sidebar settings:
- **Response Creativity** (Temperature): 0.0 to 1.0
  - Lower (0.0-0.3): More focused and deterministic
  - Medium (0.4-0.7): Balanced creativity
  - Higher (0.8-1.0): More creative and varied

### Customizing System Prompt

Edit the `system_prompt` in the `LocalChatbot` class to change AI behavior:

```python
self.system_prompt = """Your custom instructions here..."""
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for the local LLM infrastructure
- [Meta AI](https://ai.meta.com/) for Llama 3.2 model
- [Streamlit](https://streamlit.io/) for the web framework
- [Plotly](https://plotly.com/) for interactive visualizations

## 📞 Contact

**Ankit Bhaumik**
- GitHub: [@Ankitbhaumik916](https://github.com/Ankitbhaumik916)
- Project Link: [https://github.com/Ankitbhaumik916/Chat_bot_llama](https://github.com/Ankitbhaumik916/Chat_bot_llama)

## 🎯 Tech Stack

- **Backend**: Python 3.x
- **AI Model**: Llama 3.2 (Meta AI)
- **LLM Runtime**: Ollama
- **Frontend**: Streamlit
- **Visualizations**: Plotly, Pandas
- **NLP**: Custom sentiment analysis & entity recognition
- **Data Storage**: Session state (in-memory), JSON export

---

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Ankit Bhaumik
