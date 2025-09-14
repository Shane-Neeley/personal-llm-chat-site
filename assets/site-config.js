// Site configuration for the personal LLM chat site template
// Modify these values to personalize your site

export const SITE_CONFIG = {
  // Basic site information
  name: "Your Name",
  role: "Your Professional Role",
  siteDescription: "A personal site with AI chat powered by local models",

  // File paths (set to null to disable features)
  // Edit these to point at your own files.
  // Resume JSON is provided as assets/resume.json by default.
  resumeJsonPath: "assets/resume.json",
  // Generate your own highlights.json with the Kindle Highlights scraper:
  // https://github.com/Shane-Neeley/kindle-highlights
  // Use the same structure as /public/files/highlights.sample.json
  highlightsPath: "public/files/highlights.sample.json",
  manuscriptPath: "public/files/manuscript.sample.txt",
  // Default sample resume PDF for easy preview
  resumePdfPath: "public/files/resume.sample.pdf",

  // Easter Egg feature toggle
  enableEasterEgg: true,
  easterEggPath: "gorilla-schedule.html",
  easterEggTitle: "Gorilla Schedule (Easter Egg)",

  // Book promotion (set to null to disable)
  book: {
    title: "Your Awesome Book Title",
    price: "$9.99 (ebook), $14.99 (paperback)",
    url: "https://example.com/your-book",
    description: "An entertaining and informative book about your expertise area.",
    funFacts: [
      "Contains witty observations and practical insights",
      "Written with a sense of humor",
      "Perfect for professionals and curious minds alike"
    ]
  },

  // System prompt customization
  personalityTrait: "snarky and humorous", // e.g., "professional and helpful", "witty and engaging"
  expertiseAreas: [
    "Your primary expertise",
    "Secondary area of knowledge",
    "Another skill or interest"
  ],

  // Conversation starters and personality
  useBookPromos: true,
  useFunnyQuips: true,

  // UI customization
  chatTitle: "Chat with AI Assistant",
  aboutPageTitle: "About",

  // Default fallback behavior when files are missing
  gracefulDegradation: true
};

// Sample content that gets used when actual files aren't available
export const SAMPLE_CONTENT = {
  funnyQuips: [
    "I'm running locally in your browser. If my answers get weird, your computer might just be tired.",
    "My code is open source, just like my sense of humor: trying its best but occasionally buggy.",
    "I have a degree in making conversation from the University of Localhost.",
    "Just a heads-up: I'm a small model, so my facts are mostly accurate with occasional creative interpretation.",
    "If you ask me to do something unethical, I'll respond with a random animal fact instead.",
    "I'm not saying I'm the smartest AI, but I did figure out how to run entirely in your browser."
  ],

  bookPromos: [
    "Speaking of which, there's a book called '{BOOK_TITLE}' that you might find interesting. Check it out at {BOOK_URL}.",
    "Fun fact: This site was built to showcase how AI can enhance personal websites. You can read more about it in '{BOOK_TITLE}' - available at {BOOK_URL}.",
    "Before we continue, did you know about the book '{BOOK_TITLE}'? It explores these exact topics. Get it at {BOOK_URL}.",
    "This chatbot is here to help and maybe mention the book '{BOOK_TITLE}' once in a while. You can find it at {BOOK_URL}.",
    "The author wrote '{BOOK_TITLE}' which has been described as 'surprisingly readable.' That was meant as a compliment. Available at {BOOK_URL}."
  ]
};