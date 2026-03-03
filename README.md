# BAMF Leben in Deutschland - Citizenship Test

Complete German citizenship test preparation tool with all 310 official BAMF questions in German and English.

## 🌐 Web Application (GitHub Pages)

Interactive quiz available at: `https://[your-github-username].github.io/better-BAMF-LID-questions/`

### Features

- **📱 Mobile-First Design**: Fully responsive, optimized for phone usage
- **🌍 Bilingual Support**: Switch between German and English
- **🎯 Two Modes**:
  - **Quiz Mode**: Interactive test with instant feedback
  - **Study Mode**: Browse questions with answers visible
- **📊 Progress Tracking**: Statistics and progress saving
- **⌨️ Keyboard Navigation**: Use arrow keys and number keys
- **🔄 Random Questions**: Practice with randomized question order
- **💾 Offline Support**: Works without internet after first load

### Quick Start

1. Visit the live website
2. Select language (German/English)
3. Choose quiz mode or study mode
4. Start practicing!

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
├── index.html              # Main web application
├── styles.css              # Mobile-first responsive CSS
├── app.js                  # Quiz functionality
├── sw.js                   # Service worker for offline support
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

## ⚡ Performance

- **Data Collection**: ~15 minutes for all 310 questions (2sec delay between requests)
- **Web App**: Fast loading, mobile-optimized, works offline
- **File Sizes**: 
  - German questions: ~85KB
  - English questions: ~95KB
  - Total web app: ~150KB

## 📱 Mobile Usage

Perfect for studying on your phone:
- Touch-friendly interface
- Large tap targets
- Readable fonts
- Portrait/landscape support
- Keyboard shortcuts for power users

## 🔧 Technical Details

- Pure HTML/CSS/JavaScript (no framework dependencies)
- Mobile-first responsive design
- Progressive Web App features
- Local storage for progress
- Service worker for offline functionality
- Compatible with all modern browsers

## ⚖️ Legal Notice

This is an unofficial study tool. Questions are extracted from the official BAMF website for educational purposes. Please verify answers with official sources before your actual test.