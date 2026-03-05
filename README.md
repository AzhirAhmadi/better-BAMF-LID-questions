# BAMF Leben in Deutschland - Citizenship Test

Complete German citizenship test preparation tool with all 310 official BAMF questions in German and English.

## 📁 Project Structure

```
├── index.html        # 🌐 Main quiz interface (GitHub Pages entry)
├── app.js            # Quiz application logic  
├── styles.css        # Styling and responsive design
├── sw.js             # Service worker for offline support
├── bamf-questions-merged.json  # Bilingual question data
├── README.md         # This file - project documentation
│
├── infrastructure/   # 🛠️ Development & maintenance tools
│   ├── capture-questions.js    # BAMF website scraper
│   ├── translate-bamf.js       # Translation automation
│   ├── debug-question.js       # Debug utilities
│   ├── package.json            # Node.js dependencies
│   ├── bamf-questions.json     # German source data
│   └── README.md               # Infrastructure usage guide
│
└── docs/            # 📚 Documentation (future)
```

## 🚀 Quick Start

### For Users (Just want to use the quiz)
```bash
# Files are in root directory - ready for GitHub Pages
python3 -m http.server 3000
# Visit http://localhost:3000
```

### For Developers (Want to update data)
```bash
cd infrastructure
npm install
npm run capture      # Extract questions from BAMF website
npm run translate    # Create English translations
# Updated data automatically goes to bamf-questions-merged.json in root
```

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

## 🛠️ Infrastructure Tools

### Data Collection Tool

#### How it works

- Opens BAMF website with Playwright
- Goes through each question 1-310
- Extracts question text (OCR for images, DOM for text)
- Extracts 4 multiple choice options
- Clicks answer to reveal correct one
- Saves immediately to JSON

#### Smart handling

- **Skip**: Question exists + 100% correct → skip
- **Replace**: Question exists + incomplete/wrong → replace  
- **Add**: Question missing → insert in correct position

#### Setup

```bash
cd infrastructure
npm install
```

#### Run Data Collection

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

### 🌍 Translation Tool

#### Automated Google Translate Integration

The translation system converts German BAMF questions to English using Google Translate's free API, creating a bilingual JSON with safe keyed structure.

#### Run Translation

```bash
cd infrastructure

# Translate all 310 questions
node translate-bamf.js

# Resume from last translated question
node translate-bamf.js --resume

# Test with first 5 questions only
node translate-bamf.js --test

# Start from specific question
node translate-bamf.js --from=50

# Limit number of questions
node translate-bamf.js --limit=10
```

#### Translation Features

- **Safe Structure**: Q/A/B/C/D keys prevent option misalignment
- **Progress Tracking**: Saves progress every 5 questions
- **Error Recovery**: Continues on failures with error markers
- **Rate Limiting**: 2-second delays respect Google's limits
- **Resume Support**: Skip already completed translations
- **Quality Control**: Validates completeness of translations

## 🚀 Deploy to GitHub Pages

1. Push to GitHub repository
2. Go to repository Settings → Pages
3. Select source: Deploy from branch `main`
4. Your quiz will be available at: `https://[username].github.io/[repo-name]/`

## 📋 JSON Structure

**New Bilingual Structure (v3.0)** - Keyed options for translation safety:

```json
{
  "questions": [
    {
      "number": 1,
      "Q": {
        "de": "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil...",
        "en": "In Germany, people are allowed to openly say something against the government because..."
      },
      "A": {
        "de": "hier Religionsfreiheit gilt.",
        "en": "freedom of religion applies here."
      },
      "B": {
        "de": "die Menschen Steuern zahlen.",
        "en": "people pay taxes."
      },
      "C": {
        "de": "die Menschen das Wahlrecht haben.",
        "en": "people have the right to vote."
      },
      "D": {
        "de": "hier Meinungsfreiheit gilt.",
        "en": "freedom of opinion applies here."
      },
      "answer": "D"
    }
  ],
  "metadata": {
    "totalQuestions": 310,
    "lastUpdated": "2026-03-04T22:45:30.794Z",
    "translationService": "Google Translate",
    "structure": "BAMF Optimized (Q/A/B/C/D keys)"
  }
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
- Service worker v3.0 with automatic cache updates
- HTTP cache headers for immediate updates
- Version-controlled assets (CSS/JS v3.0)
- Optimized for GitHub Pages hosting

## 📋 Version History

### **Version 3.0** (Latest) - Automated Translation & Legal Protection
🤖 **Translation Automation:**
- **Google Translate Integration**: Automated translation of all 310 questions
- **Safe Keyed Structure**: Q/A/B/C/D format prevents option misalignment
- **Translation Tool**: Complete automation with resume/test capabilities
- **Quality Assurance**: Validation and error recovery for reliable translations

🛡️ **Legal & Compliance:**
- **Comprehensive Disclaimer**: OCR/AI processing and translation notices
- **Data Source Attribution**: Clear dating of capture (March 2026) and translation (March 4, 2026)
- **Legal Protection**: Full liability disclaimers and usage warnings
- **User Consent**: Required disclaimer acceptance with localStorage persistence
- **Official Source Links**: Direct links to BAMF website for verification

🔧 **Technical Improvements:**
- **Single Data Source**: Merged bilingual JSON replaces separate files
- **Keyed Options**: A/B/C/D structure prevents array-based translation errors
- **Enhanced UI**: Updated to use new data structure with improved error handling
- **Professional Disclaimers**: Styled warning box with comprehensive legal notices

## ⚖️ Legal Notice & Disclaimer

**⚠️ IMPORTANT: This is an unofficial study tool and not affiliated with BAMF or the German government.**

### Data Sources & Processing
- **German Text**: Extracted in March 2026 from official BAMF website using OCR (Optical Character Recognition) and AI processing. Some text may contain recognition errors.
- **English Translations**: Generated on March 4, 2026 using Google Translate API. Translations may not be fully accurate or reflect legal nuances.
- **No Guarantee**: We provide no warranties regarding accuracy, completeness, or legal validity of the content.

### Legal Protection
- Always verify answers with **official BAMF sources** before your actual test
- This tool is for **study purposes only** and should not be your sole preparation method  
- We assume **no liability** for any consequences arising from use of this tool
- For official information, visit: **[www.bamf.de](https://www.bamf.de)**

### Usage Terms
By using this tool, you acknowledge that you understand the limitations above and agree to use this tool at your own risk for educational purposes only.

---

**Official BAMF Resources:**
- [BAMF Leben in Deutschland Test](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/InhaltAblauf/Orientierungskurs/orientierungskurs-node.html)
- [Practice Questions (Official)](https://oet.bamf.de/ords/oetut/f?p=514:1)