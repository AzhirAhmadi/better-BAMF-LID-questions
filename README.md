# BAMF Leben in Deutschland - Citizenship Test

Complete German citizenship test preparation tool with all 310 official BAMF questions in German and English.

## 🌐 Web Application (GitHub Pages)

**🔗 Live Demo: https://azhirahmadi.github.io/better-BAMF-LID-questions/**

Interactive quiz available at: `https://[your-github-username].github.io/better-BAMF-LID-questions/`

### ✨ Features

- **📱 Mobile-First Design**: Fully responsive, optimized for phone usage
- **🇩🇪 German-Focused Learning**: Prioritizes German text with larger, bolder fonts for better memorization
- **🔄 Smart Translation Toggles**: Individual EN/DE buttons for questions, options, and answers - no cluttered displays
- **🎯 Three Study Modes**:
  - **Quiz Mode**: Interactive test with instant feedback
  - **Study Mode**: Browse questions with answers highlighted
  - **Answers Only**: Clean view with just questions and correct answers
- **🎲 Direct Navigation**: Jump to any question (1-310) or pick random questions
- **📊 Progress Tracking**: Statistics, progress saving, and session continuity
- **⌨️ Keyboard Navigation**: Use arrow keys and number keys for quick navigation
- **💾 Offline Support**: Works without internet after first load
- **🚀 Cache-Optimized**: No more Shift+Refresh needed - updates automatically

### 🎓 Quick Start

1. **Visit the live website**
2. **Choose your study mode**:
   - Quiz Mode: Test yourself interactively
   - Study Mode: Learn with answers shown
   - Answers Only: Quick review mode
3. **Navigate efficiently**:
   - Use "Go to Question" dropdown for direct access
   - Click EN/DE buttons for translations when needed
   - Use arrow keys for quick navigation
4. **Focus on German**: See German text prominently, get English help only when needed

## 📋 Data Collection Tool

### How it works

- Opens BAMF website with Playwright
- Goes through each question 1-310
- Extracts question text (OCR for images, DOM for text)
- Extracts 4 multiple choice options
- Clicks answer to reveal correct one
- Saves immediately to JSON

### Smart handling

- **Skip**: Question exists + 100% correct → skip
- **Replace**: Question exists + incomplete/wrong → replace  
- **Add**: Question missing → insert in correct position

### Setup

```bash
npm install
```

### Run Data Collection

```bash
# All questions (skip existing correct ones)
npm run capture

# Start fresh from question 1
npm run capture:from-start

# Resume from last captured
npm run capture:resume

# Test with first 5 questions
npm run test

# Custom range
node capture-questions.js --from=50 --limit=10
```

## 📁 File Structure

```
├── index.html              # Main web application (with cache-busting)
├── styles.css              # Mobile-first responsive CSS (v2.0)
├── app.js                  # Quiz functionality with smart translations (v2.0)
├── sw.js                   # Service worker for offline support (v2.0)
├── bamf-questions.json     # German questions (310 total)
├── bamf-questions-en.json  # English translations (310 total)
├── capture-questions.js    # Data scraping tool
└── package.json           # Dependencies for scraper
```

## 🚀 Deploy to GitHub Pages

1. Push to GitHub repository
2. Go to repository Settings → Pages
3. Select source: Deploy from branch `main`
4. Your quiz will be available at: `https://[username].github.io/[repo-name]/`

## 📋 JSON Structure

Questions are stored in identical format for both languages:

```json
{
  "questions": [
    {
      "number": 1,
      "questionText": "In Deutschland dürfen Menschen...",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "option2"
    }
  ]
}
```

## ⚡ Performance & UX

### **Learning Optimized**
- **German-First Approach**: Larger (1.3rem), bolder German text for better memorization
- **Smart Translations**: English appears only when requested via small toggle buttons
- **Clean Interface**: No cluttered bilingual displays - focus on what matters
- **Direct Navigation**: Jump to any question instantly, continue where you left off

### **Technical Performance** 
- **Data Collection**: ~15 minutes for all 310 questions (2sec delay between requests)
- **Web App**: Fast loading, mobile-optimized, works offline
- **File Sizes**: 
  - German questions: ~117KB
  - English questions: ~107KB
  - Total web app: ~250KB
- **Cache Optimized**: Automatic updates, no manual refresh needed

## 📱 Mobile Excellence

**Designed for phone-first studying:**
- Touch-friendly interface with large tap targets
- Individual translate buttons for precise control
- Question selector dropdown for quick navigation
- Portrait/landscape support with responsive design
- Keyboard shortcuts for power users (arrow keys, number keys)

## 🔧 Technical Implementation

### **Frontend Stack**
- Pure HTML/CSS/JavaScript (no framework dependencies)
- Mobile-first responsive design with CSS Grid/Flexbox
- Progressive Web App features (service worker, offline support)
- Local storage for progress tracking and session continuity

### **Translation System**
- Individual toggle buttons for questions, options, and answers
- State management for translation preferences
- Clean overlay system (no layout shifts)
- German text prioritization with English on-demand

### **Navigation Features**
- Direct question access (1-310) via dropdown selector
- Random question generator for varied practice
- Keyboard navigation (arrows, numbers) for efficiency
- Progress tracking with accuracy statistics

### **Cache & Performance**
- Service worker v2.0 with automatic cache updates
- HTTP cache headers for immediate updates
- Version-controlled assets (CSS/JS v2.0)
- Optimized for GitHub Pages hosting

## 📋 Version History

### **Version 2.0** (Latest) - Enhanced Learning Experience
🎯 **Major UX Improvements:**
- **German-First Design**: Larger, bolder German text (1.3rem, font-weight: 600)
- **Smart Translation System**: Individual EN/DE toggle buttons for questions, options, answers
- **Direct Navigation**: "Go to Question" dropdown to jump to any question (1-310)
- **Three Study Modes**: Quiz, Study, and Answers Only modes
- **Cache Optimization**: Automatic updates without manual refresh needed

🔧 **Technical Enhancements:**
- Removed cluttered bilingual display - cleaner interface
- Added translation state management with overlay system
- Improved mobile responsiveness with better touch targets  
- Enhanced service worker with automatic cache clearing
- Version-controlled assets (CSS/JS v2.0) for reliable updates

### **Version 1.0** - Initial Release
- Complete question scraper for all 310 BAMF questions
- Basic web interface with German/English language switching
- Quiz and study modes with progress tracking
- Mobile-responsive design with offline support

## ⚖️ Legal Notice

This is an unofficial study tool. Questions are extracted from the official BAMF website for educational purposes. Please verify answers with official sources before your actual test.