# Personal LLM Chat Site Template

A modern personal website template with AI chat functionality that runs entirely in your browser. No server required!

## Features

- 🤖 **Local AI Chat** - Powered by transformers.js, runs client-side
- 🔒 **Privacy-First** - All conversations stay in your browser
- ⚡ **Fast & Lightweight** - Minimal dependencies, quick loading
- 🎨 **Easily Customizable** - Configuration-driven personalization
- 📱 **Responsive Design** - Works on all devices
- 🎁 **Optional Easter Egg** - Fun hidden features (toggleable)
- 🚀 **Zero Server Setup** - Deploy anywhere that serves static files

## Why this?

- **A chat-with-me site**: More engaging than a static resume. Add a light personality.
- **Real context**: Pulls from your résumé, Kindle highlights (for insight into your brain), and a manuscript or writing sample.
- **Future-proof**: Swap models as they improve; keep the UX stable.
- **Private by default**: Runs in-browser; content is yours.

Used as the foundation for ShaneNeeley.com. Future plans: lightweight checks for better small models, optional upgrade prompts, and integrations for new local AI tools.

## Credits

- Built with [transformers.js](https://huggingface.co/docs/transformers.js)
- Styled with [PicoCSS](https://picocss.com/)

---

## Quick Start

Live demo (after Actions runs): `https://shane-neeley.github.io/personal-llm-chat-site/`

### 1. Clone & Setup

```bash
# Clone the template
git clone https://github.com/Shane-Neeley/personal-llm-chat-site.git my-site
cd my-site

# Install dependencies (requires Node.js v24+)
nvm use
npm install
```

### 2. Personalize Your Site

Edit `assets/site-config.js` and `assets/resume.json` to customize:

```javascript
export const SITE_CONFIG = {
  name: "Your Name",
  role: "Your Professional Role",
  enableEasterEgg: true,
  // ... more options
};
```

### 3. Add Your Content

Replace or keep the sample files (site works out-of-the-box):

- **Resume**: Edit `assets/resume.json` and optionally replace `public/files/resume.sample.pdf`
- **Book Highlights**: Replace `public/files/highlights.sample.json`
  - Generate from Kindle using: https://github.com/Shane-Neeley/kindle-highlights
- **Manuscript**: Replace `public/files/manuscript.sample.txt` with your book/writing

### 4. Test & Build

```bash
# Run tests
npm test

# Build for production
npm run build

# Start development server
npm start
```

### 5. Deploy

#### GitHub Pages (Recommended)

- Already configured via `.github/workflows/pages.yml`.
- Push to `main` and GitHub Actions will build `dist/` and deploy automatically.
- Your site will be available at `https://<your-username>.github.io/personal-llm-chat-site/`.
- Verify: Repository → Settings → Pages → Build and deployment = GitHub Actions.
- Custom domain (optional): Settings → Pages → Custom domain (adds `CNAME`).

#### Firebase Hosting (Alternative)

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting
```

#### Other Options

Any static hosting service works:
- Netlify: Drop the `dist` folder
- Vercel: Connect your GitHub repo
- Surge.sh: `surge dist`

## Configuration

### Main Config File

Edit `assets/site-config.js`:

```javascript
export const SITE_CONFIG = {
  // Basic info
  name: "Your Name",
  role: "Your Professional Role",

  // File paths (set to null to disable features)
  resumeJsonPath: "/assets/resume.json",
  resumePdfPath: "/public/files/resume.sample.pdf",
  highlightsPath: "/public/files/highlights.sample.json",
  manuscriptPath: "/public/files/manuscript.sample.txt",

  // Easter Egg feature toggle
  enableEasterEgg: true,
  easterEggPath: "/gorilla-schedule.html",
  easterEggTitle: "Gorilla Schedule (Easter Egg)",

  // Book promotion (set to null to disable)
  book: {
    title: "Your Awesome Book Title",
    price: "$9.99 (ebook), $14.99 (paperback)",
    url: "https://example.com/your-book",
    description: "An entertaining and informative book about your expertise area."
  },

  // AI personality customization
  personalityTrait: "snarky and humorous", // or "professional and helpful"
  expertiseAreas: [
    "Your primary expertise",
    "Secondary area of knowledge",
    "Another skill or interest"
  ],

  // Feature toggles
  useBookPromos: true,
  useFunnyQuips: true,
  gracefulDegradation: true
};
```

### Content File Formats

#### Resume JSON (`assets/resume.json`)
```javascript
{
  "name": "Your Name",
  "currentRole": "Senior Developer at Company (2023 - Present)",
  "experience": "5 Years Experience",
  "summary": "Full-Stack Development, AI Integration, Team Leadership",
  "technicalSkills": ["JavaScript", "Python", "React", "..."],
  "workHistory": [
    {
      "company": "Company Name",
      "role": "Your Role",
      "period": "2023 - Present",
      "description": "What you accomplished..."
    }
  ],
  "education": ["Degree - University (Year)"],
  "publications": ["Publications and achievements"]
}
```

#### Book Highlights (`public/files/highlights.json`)
```javascript
{
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "highlights": [
        { "text": "Highlighted quote or passage..." }
      ]
    }
  ]
}
```

Generate highlights from Kindle using: https://github.com/Shane-Neeley/kindle-highlights

## Development

### Project Structure
```
├── assets/
│   ├── site-config.js       # Main configuration
│   ├── context.js           # AI context system
│   ├── chat.js             # Chat component
│   ├── chat.css            # Chat styles
│   └── resume.json         # Sample resume data
├── public/files/           # Content files (highlights, manuscript, etc.)
├── scripts/
│   └── build.js            # Build script (copies to dist)
├── test/                   # Test files
├── index.html              # Main page
├── about.html              # About page
└── gorilla-schedule.html   # Easter Egg feature
```

### Available Scripts

- `npm test` - Run tests
- `npm run build` - Build for production
- `npm start` - Start development server

### AI Models

Runs small models entirely in your browser via transformers.js. Choose from a few presets; you can add/remove models in `assets/chat.js`.

## Troubleshooting

### Common Issues

**Node version**: Ensure you're using Node.js v24+
```bash
nvm install 24
nvm use 24
```

**Build fails**: Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

**Chat not loading**: Check browser console for errors. Models need time to download on first use.

**Content not showing**: Verify file paths in `site-config.js` match your actual files.

### Browser Requirements

- Modern browsers with WebAssembly support
- Chrome/Edge 88+, Firefox 89+, Safari 15.2+

## License

MIT License - see [LICENSE](LICENSE) file for details.

🎉 **Fork this template and create your own AI-powered personal site!**