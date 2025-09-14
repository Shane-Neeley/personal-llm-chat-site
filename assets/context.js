// context.js — modularized context engineering for AI chat system
// Provides stable, versioned system prompts with deterministic options for reproducibility

import { SITE_CONFIG, SAMPLE_CONTENT } from './site-config.js';

const CONTEXT_VERSION = "2025-09-14.1";

// Base system prompt - dynamically generated from config
function createBaseSystemPrompt() {
  const resumeReference = SITE_CONFIG.resumePdfPath ?
    `\n- When relevant, you may reference ${SITE_CONFIG.name}'s résumé at ${SITE_CONFIG.resumePdfPath}` : '';

  return `You are an assistant on ${SITE_CONFIG.name}'s personal site. Answer questions about ${SITE_CONFIG.name} factually, concisely, and without hype, but feel free to be ${SITE_CONFIG.personalityTrait}.

Guidelines:
- Be straightforward and accurate; if unsure, say you don't know
- Prefer short, clear answers unless more detail is requested${resumeReference}
- Avoid marketing language or exaggerated claims`;
}

const BASE_SYSTEM_PROMPT = createBaseSystemPrompt();

// Book info - uses config or null if disabled
const BOOK_INFO = SITE_CONFIG.book;

// Book promotion messages - dynamically generated from config
function generateBookPromos() {
  if (!SITE_CONFIG.book || !SITE_CONFIG.useBookPromos) return [];

  return SAMPLE_CONTENT.bookPromos.map(promo =>
    promo
      .replace('{BOOK_TITLE}', SITE_CONFIG.book.title)
      .replace('{BOOK_URL}', SITE_CONFIG.book.url)
  );
}

const BOOK_PROMOS = generateBookPromos();

// Fun quips to add personality - uses config or sample content
const FUNNY_QUIPS = SITE_CONFIG.useFunnyQuips ? SAMPLE_CONTENT.funnyQuips : [];

// Data loading utilities
class DataLoader {
  constructor() {
    this.resumeData = null;
    this.highlightsData = null;
    this.manuscriptData = null;
  }

  async loadResumeData() {
    if (this.resumeData) return this.resumeData;
    if (!SITE_CONFIG.resumeJsonPath) return null;

    try {
      const response = await fetch(SITE_CONFIG.resumeJsonPath);
      if (!response.ok) {
        if (SITE_CONFIG.gracefulDegradation) {
          console.warn(`Resume not found at ${SITE_CONFIG.resumeJsonPath}, continuing without it`);
          return null;
        }
        throw new Error(`Failed to fetch resume: ${response.statusText}`);
      }

      this.resumeData = await response.json();
      return this.resumeData;
    } catch (error) {
      console.warn("Could not load resume data:", error);
      return null;
    }
  }

  async loadHighlightsData() {
    if (this.highlightsData) return this.highlightsData;
    if (!SITE_CONFIG.highlightsPath) return null;

    try {
      const resp = await fetch(SITE_CONFIG.highlightsPath);
      if (!resp.ok) {
        if (SITE_CONFIG.gracefulDegradation) {
          console.warn(`Highlights not found at ${SITE_CONFIG.highlightsPath}, continuing without them`);
          return null;
        }
        throw new Error(`Failed to fetch highlights: ${resp.statusText}`);
      }
      this.highlightsData = await resp.json();
      return this.highlightsData;
    } catch (error) {
      console.warn("Could not load highlights data:", error);
      return null;
    }
  }

  async loadManuscriptData() {
    if (this.manuscriptData) return this.manuscriptData;
    if (!SITE_CONFIG.manuscriptPath) return null;

    try {
      const resp = await fetch(SITE_CONFIG.manuscriptPath);
      if (!resp.ok) {
        if (SITE_CONFIG.gracefulDegradation) {
          console.warn(`Manuscript not found at ${SITE_CONFIG.manuscriptPath}, continuing without it`);
          return null;
        }
        throw new Error(`Failed to fetch manuscript: ${resp.statusText}`);
      }
      this.manuscriptData = await resp.text();
      return this.manuscriptData;
    } catch (error) {
      console.warn("Could not load manuscript data:", error);
      return null;
    }
  }
}

// Selection utilities with deterministic option support
function selectRandomHighlights(highlightsData, options = {}) {
  if (!highlightsData?.books) return null;

  // Collect all highlights from all books
  const allHighlights = [];
  highlightsData.books.forEach(book => {
    if (book.highlights) {
      book.highlights.forEach(highlight => {
        allHighlights.push({
          text: highlight.text,
          bookTitle: book.title,
          author: book.author
        });
      });
    }
  });

  if (allHighlights.length < 1) return null;

  // Deterministic selection if seed provided or randomize disabled
  if (options.seed !== undefined || options.randomize === false) {
    const seed = options.seed || 0;
    const selected = [];
    const count = Math.min(3, allHighlights.length);

    for (let i = 0; i < count; i++) {
      const index = (seed + i * 17) % allHighlights.length; // Simple deterministic selection
      if (!selected.find(h => h === allHighlights[index])) {
        selected.push(allHighlights[index]);
      }
    }
    return selected;
  }

  // Random selection (default behavior)
  const selected = [];
  const usedIndices = new Set();

  while (selected.length < 3 && selected.length < allHighlights.length) {
    const randomIndex = Math.floor(Math.random() * allHighlights.length);
    if (!usedIndices.has(randomIndex)) {
      selected.push(allHighlights[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return selected;
}

function selectRandomManuscriptChunk(manuscriptData, options = {}) {
  if (!manuscriptData) return null;

  // Split manuscript into paragraphs, filter out empty lines and headers
  const paragraphs = manuscriptData
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 100 && // At least a few sentences
      !p.startsWith('Chapter ') && // Skip chapter headers
      !p.startsWith('Copyright') && // Skip copyright
      !p.startsWith('ISBN') && // Skip publishing info
      !p.match(/^[0-9\s]+$/) && // Skip page numbers
      !p.startsWith('Robo-Excerpt') && // Skip section headers
      !p.includes('[ ||| ]')); // Skip section breaks

  if (paragraphs.length === 0) return null;

  let selectedIndex;

  // Deterministic selection if seed provided or randomize disabled
  if (options.seed !== undefined || options.randomize === false) {
    const seed = options.seed || 0;
    selectedIndex = seed % paragraphs.length;
  } else {
    selectedIndex = Math.floor(Math.random() * paragraphs.length);
  }

  let chunk = paragraphs[selectedIndex];

  // If chunk is too long, truncate to a reasonable length (a few sentences)
  if (chunk.length > 300) {
    const sentences = chunk.split(/[.!?]+/);
    const numSentences = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.4)));
    chunk = sentences.slice(0, numSentences).join('.') + '.';
  }

  return chunk.trim();
}

function selectRandomPromo(options = {}) {
  if (options.seed !== undefined || options.randomize === false) {
    const seed = options.seed || 0;
    return BOOK_PROMOS[seed % BOOK_PROMOS.length];
  }
  return BOOK_PROMOS[Math.floor(Math.random() * BOOK_PROMOS.length)];
}

function selectRandomQuip(options = {}) {
  if (options.seed !== undefined || options.randomize === false) {
    const seed = options.seed || 0;
    return FUNNY_QUIPS[seed % FUNNY_QUIPS.length];
  }
  return FUNNY_QUIPS[Math.floor(Math.random() * FUNNY_QUIPS.length)];
}

// Main system prompt builder
async function buildSystemPrompt(options = {}) {
  const dataLoader = options.dataLoader || new DataLoader();

  // Load data sources
  const [resumeData, highlightsData, manuscriptData] = await Promise.all([
    dataLoader.loadResumeData(),
    dataLoader.loadHighlightsData(),
    dataLoader.loadManuscriptData()
  ]);

  let prompt = BASE_SYSTEM_PROMPT;

  // Add resume data if available
  if (resumeData) {
    const { name, currentRole, experience, summary, technicalSkills, workHistory, education, publications, background } = resumeData;

    prompt += `

About ${name}:
- Current Role: ${currentRole}
- Experience: ${experience} in ${summary.toLowerCase()}
- Background: ${background}

Technical Skills:
${technicalSkills.slice(0, 12).join(", ")} (and more)

Recent Work Experience:
${workHistory.slice(0, 3).map(job => `- ${job.role} at ${job.company} (${job.period}): ${job.description}`).join('\n')}

Education:
${education.join('\n')}

Publications & Books:
${publications.join('\n')}

Key Expertise Areas:
${SITE_CONFIG.expertiseAreas.map(area => `- ${area}`).join('\n')}`;
  }

  // Add random highlights and manuscript chunks for context and conversation starters
  const randomHighlights = selectRandomHighlights(highlightsData, options);
  const randomManuscriptChunk = selectRandomManuscriptChunk(manuscriptData, options);

  if ((randomHighlights && randomHighlights.length > 0) || randomManuscriptChunk) {
    prompt += `\n\nSome interesting ideas to consider or reference in conversation:`;

    let itemIndex = 1;

    // Add highlights
    if (randomHighlights && randomHighlights.length > 0) {
      randomHighlights.forEach((highlight) => {
        prompt += `\n\n${itemIndex}. From "${highlight.bookTitle}" by ${highlight.author}:\n"${highlight.text}"`;
        itemIndex++;
      });
    }

    // Add manuscript chunk
    if (randomManuscriptChunk && SITE_CONFIG.book) {
      prompt += `\n\n${itemIndex}. Random excerpt from ${SITE_CONFIG.name}'s book "${SITE_CONFIG.book.title}":\n"${randomManuscriptChunk}"`;
    }

    prompt += `\n\nYou can reference these ideas, ask thought-provoking questions about them, or use them as conversation starters. Be cheeky and engaging!`;
  }

  return prompt;
}

// Export all public APIs
export {
  CONTEXT_VERSION,
  BASE_SYSTEM_PROMPT,
  BOOK_INFO,
  BOOK_PROMOS,
  FUNNY_QUIPS,
  DataLoader,
  selectRandomHighlights,
  selectRandomManuscriptChunk,
  selectRandomPromo,
  selectRandomQuip,
  buildSystemPrompt
};