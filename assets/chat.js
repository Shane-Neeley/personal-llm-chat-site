// chat.js — clean, modular web component for local LLMs via Transformers.js

// Import context module for system prompts and constants
import {
  buildSystemPrompt,
  selectRandomPromo,
  selectRandomQuip,
  DataLoader
} from './context.js';
import { SITE_CONFIG } from './site-config.js';

// Model configurations - updated for 2025
const MODELS = [
  { id: "HuggingFaceTB/SmolLM2-135M-Instruct", label: "SmolLM2 135M (Fast & Derpy)", dtype: "q4" },
  { id: "HuggingFaceTB/SmolLM2-360M-Instruct", label: "SmolLM2 360M (Recommended)", dtype: "q4" },
  { id: "Xenova/codegen-350M-mono", label: "Tiny Coder 350M (Weird)", dtype: "q4" },
  { id: "Xenova/tiny-random-StableLmForCausalLM", label: "Tiny StableLM (Unstable Ideas)", dtype: "q4" },
  { id: "onnx-community/TinyLlama-1.1B-Chat-v1.0-ONNX", label: "TinyLlama 1.1B (Actually Smart, but Slow)", dtype: "q4" },
];

// Configuration with dynamic ranges for more natural, varied responses
const CONFIG = {
  CDN_URL: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2",

  // Dynamic ranges for generation parameters - values picked randomly for each response
  RANGES: {
    MAX_NEW_TOKENS: { min: 80, max: 200 },     // Vary response length per question
    TEMPERATURE: { min: 0.5, max: 1.3 },       // medium to high creativity
    TOP_P: { min: 0.8, max: 0.95 },            // Nucleus sampling variation
    TOP_K: { min: 15, max: 25 },               // Top-K sampling range
    REPETITION_PENALTY: { min: 1.02, max: 1.15 }, // Avoid repetition variation
    HISTORY_LIMIT: { min: 5, max: 10 },        // Vary context history length
    MAX_CONTEXT_LENGTH: { min: 800, max: 1100 } // Context window variation
  },

  // Static configurations
  DEBUG: true,

  // Helper function to get dynamic values
  getDynamicValues() {
    const values = {};
    for (const [key, range] of Object.entries(this.RANGES)) {
      if (key.includes('TEMPERATURE') || key.includes('TOP_P') || key.includes('REPETITION_PENALTY')) {
        // Use more precision for float values
        values[key] = Math.random() * (range.max - range.min) + range.min;
      } else {
        // Use integers for token counts, limits, etc.
        values[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
    }
    return values;
  }
};

// Optional debug logging
if (CONFIG.DEBUG) {
  const sampleParams = CONFIG.getDynamicValues();
  console.log("⚙️ AI parameter ranges:", CONFIG.RANGES);
  console.log("📊 Sample dynamic values:", sampleParams);
}

// Global debug hooks for prompt and message inspection
let __CHAT_DEBUG__ = {
  lastSystemPrompt: null,
  lastMessages: null,
  lastFormatted: null,
  lastResponse: null,
  lastSelections: null,
  enabled: CONFIG.DEBUG
};

if (typeof window !== 'undefined') {
  window.__CHAT_DEBUG__ = __CHAT_DEBUG__;
}

// Simplified system prompt manager using context module
class SystemPromptManager {
  constructor() {
    this.dataLoader = new DataLoader();
    this.lastPrompt = null;
    this.lastSelections = null;
  }

  async generateSystemPrompt(options = {}) {
    const prompt = await buildSystemPrompt({ ...options, dataLoader: this.dataLoader });

    // Store for debug hooks
    this.lastPrompt = prompt;
    this.lastSelections = {
      timestamp: new Date().toISOString(),
      options,
      promptLength: prompt.length
    };

    // Update global debug hooks
    if (__CHAT_DEBUG__.enabled) {
      __CHAT_DEBUG__.lastSystemPrompt = prompt;
      __CHAT_DEBUG__.lastSelections = this.lastSelections;
    }

    console.log("🤖 Generated System Prompt:");
    console.log("=".repeat(80));
    console.log(prompt);
    console.log("=".repeat(80));

    return prompt;
  }

  getLastPrompt() {
    return this.lastPrompt;
  }

  getLastSelections() {
    return this.lastSelections;
  }
}

// Models that don't work, or are too slow
// { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B (Theoretically Good)", dtype: "q4" },
// { id: "microsoft/Phi-3-mini-4k-instruct-onnx-web", label: "Phi-3 Mini (The Sensible Sequel)", dtype: "q4" },
// { id: "Xenova/distilgpt2", label: "DistilGPT-2 (A Classic from 2019)", dtype: "q4" }
//   { id: "onnx-community/MobileLLM-R1-950M-ONNX", label: "MobileLLM 950M (Math + Code Monster)", dtype: "q4" },
// { id: "onnx-community/vaultgemma-1b-ONNX", label: "VaultGemma 1B (Private + Polite)", dtype: "q4" },

class ModelManager {
  constructor() {
    this.pipe = null;
    this.tokenizer = null;
    this.currentModelId = null;
    this.tf = null;
    this._loadSeq = 0;
  }

  async loadModel(modelId, hfToken = null) {
    const seq = ++this._loadSeq;

    await this._cleanup();
    await this._loadTransformers();
    this._configureAuth(hfToken);

    const model = MODELS.find(m => m.id === modelId);
    const device = navigator.gpu ? "webgpu" : undefined;

    try {
      this.pipe = await this._createPipeline(modelId, device, model?.dtype);
      if (seq !== this._loadSeq) return null;

      this.tokenizer = await this._loadTokenizer(modelId);
      if (seq !== this._loadSeq) return null;

      this.currentModelId = modelId;
      return { success: true, device: device || "cpu" };
    } catch (error) {
      if (device) {
        return await this._fallbackToCPU(modelId, seq);
      }
      throw error;
    }
  }

  async _cleanup() {
    console.log("Cleaning up previous model session...");
    try {
      if (this.pipe) {
        await this.pipe.dispose();
        console.log("Pipe disposed.");
      }
      if (this.tokenizer) {
        await this.tokenizer.dispose();
        console.log("Tokenizer disposed.");
      }
    } catch (error) {
      console.warn("An error occurred during model cleanup:", error);
    } finally {
      this.pipe = null;
      this.tokenizer = null;
      console.log("Cleanup complete.");
    }
  }

  async _loadTransformers() {
    if (this.tf) return;

    this.tf = await import(CONFIG.CDN_URL);
    // Optimize ONNX WASM path when WebGPU is unavailable
    try {
      if (!navigator.gpu && this.tf.env) {
        // Conservative number of threads to avoid contention; adjust if needed
        this.tf.env.ONNX_NUM_THREADS = 2;
      }
    } catch { }
  }

  _configureAuth(hfToken) {
    if (hfToken && this.tf.env) {
      this.tf.env.HF_TOKEN = hfToken;
    }
  }

  async _createPipeline(modelId, device, dtype) {
    try {
      return await this.tf.pipeline("text-generation", modelId, { device, dtype });
    } catch (error) {
      return await this.tf.pipeline("text-generation", modelId, { device });
    }
  }

  async _loadTokenizer(modelId) {
    try {
      const { AutoTokenizer } = this.tf;
      return await AutoTokenizer.from_pretrained(modelId);
    } catch {
      return null;
    }
  }

  async _fallbackToCPU(modelId, seq) {
    try {
      this.pipe = await this.tf.pipeline("text-generation", modelId, {});
      if (seq !== this._loadSeq) return null;
      return { success: true, device: "cpu", fallback: true };
    } catch (error) {
      throw error;
    }
  }

  async generateText(prompt, onUpdate, dynamicParams = null) {
    if (!this.pipe) throw new Error("No model loaded");

    // Use dynamic parameters or fallback to CONFIG defaults
    const params = dynamicParams || CONFIG.getDynamicValues();
    console.log("🎲 Using dynamic generation parameters:", params);

    // Enable sampling if temperature is high enough for creativity
    const shouldSample = params.TEMPERATURE > 0.05;

    // Fast decoding with dynamic parameters
    const options = {
      max_new_tokens: params.MAX_NEW_TOKENS,
      temperature: params.TEMPERATURE,
      top_p: params.TOP_P,
      top_k: params.TOP_K,
      repetition_penalty: params.REPETITION_PENALTY,
      do_sample: shouldSample,
      return_full_text: false,
      callback_function: onUpdate
    };
    console.log("⚡ Final generation options:", options);

    try {
      return await this.pipe(prompt, options);
    } catch (error) {
      if (this._isGPUKernelError(error)) {
        return await this._retryOnCPU(prompt, options);
      }
      throw error;
    }
  }

  _isGPUKernelError(error) {
    const message = String(error?.message || error || "");
    return /WebGPU|kernel|Rotary interleaved|JSEP/i.test(message);
  }

  async _retryOnCPU(prompt, options) {
    if (!this.currentModelId) throw new Error("No current model for CPU retry");

    await this._cleanup();
    this.pipe = await this.tf.pipeline("text-generation", this.currentModelId, {});
    return await this.pipe(prompt, options);
  }
}

class ChatEngine {
  constructor() {
    this.history = [];
    this._genSeq = 0;
    this.promptManager = new SystemPromptManager();
    this.bookPromoChance = 0.2; // 20% chance to show book promo
    this.currentParams = null; // Will hold dynamic params for current generation
  }

  addMessage(role, content) {
    this.history.push([role, content]);
  }

  clearHistory() {
    this.history = [];
  }

  cancelGeneration() {
    this._genSeq++;
  }

  async formatPrompt(userText, tokenizer) {
    // Generate dynamic parameters for this conversation turn
    this.currentParams = CONFIG.getDynamicValues();

    console.log("🎲 Dynamic parameters for this response:", this.currentParams);

    // Generate fresh system prompt with random highlights for each conversation
    const systemPrompt = await this.promptManager.generateSystemPrompt();

    // Prune history to prevent context overflow (using dynamic history limit)
    const relevantHistory = this._pruneHistory(userText);

    const messages = [
      { role: "system", content: systemPrompt },
      ...relevantHistory.map(([who, text]) => ({
        role: who === "me" ? "user" : "assistant",
        content: text
      })),
      { role: "user", content: userText }
    ];

    // Log conversation structure
    console.log("💬 Conversation Structure:");
    console.log(`📝 User input: "${userText}"`);
    console.log(`📚 History entries: ${relevantHistory.length}`);
    console.log("🗨️ Full conversation messages:");
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role.toUpperCase()}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    });

    // Update debug hooks with message array
    if (__CHAT_DEBUG__.enabled) {
      __CHAT_DEBUG__.lastMessages = messages;
    }

    if (tokenizer?.apply_chat_template) {
      try {
        const formatted = await tokenizer.apply_chat_template(messages, {
          tokenize: false,
          add_generation_prompt: true
        });

        // Always use full context - no truncation
        console.log("📏 Prompt length:", formatted.length, "characters");
        if (formatted.length > this.currentParams.MAX_CONTEXT_LENGTH) {
          console.log("⚠️ Prompt exceeds max length but using full context anyway");
        }

        console.log("🚀 Final Formatted Prompt (tokenizer template):");
        console.log("-".repeat(80));
        console.log(formatted);
        console.log("-".repeat(80));

        // Update debug hooks with formatted prompt
        if (__CHAT_DEBUG__.enabled) {
          __CHAT_DEBUG__.lastFormatted = formatted;
        }

        return formatted;
      } catch { }
    }

    const historyText = relevantHistory
      .map(([who, text]) => `${who === "me" ? "User" : "Assistant"}: ${text}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n${historyText ? historyText + "\n" : ""}User: ${userText}\nAssistant:`;

    // Always use full context - no truncation
    console.log("📏 Prompt length:", fullPrompt.length, "characters");
    if (fullPrompt.length > this.currentParams.MAX_CONTEXT_LENGTH) {
      console.log("⚠️ Prompt exceeds max length but using full context anyway");
    }

    console.log("🚀 Final Formatted Prompt (fallback):");
    console.log("-".repeat(80));
    console.log(fullPrompt);
    console.log("-".repeat(80));

    // Update debug hooks with formatted prompt
    if (__CHAT_DEBUG__.enabled) {
      __CHAT_DEBUG__.lastFormatted = fullPrompt;
    }

    return fullPrompt;
  }

  _pruneHistory(currentInput) {
    // Use dynamic history limit
    const historyLimit = this.currentParams ? this.currentParams.HISTORY_LIMIT : 8;

    if (this.history.length <= historyLimit) {
      return this.history.slice(-historyLimit);
    }

    // Keep recent history and any history that might be relevant to current input
    const recentHistory = this.history.slice(-historyLimit);
    const keywords = currentInput.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Look for relevant older conversations
    const relevantOlder = this.history.slice(0, -historyLimit).filter(([, text]) => {
      const textLower = text.toLowerCase();
      return keywords.some(keyword => textLower.includes(keyword));
    }).slice(-2); // Max 2 older relevant exchanges

    return [...relevantOlder, ...recentHistory];
  }



  // Finalize response by maybe adding a promo or quip
  finalizeResponse(response, userText) {
    console.log("🎭 Finalizing Response:");
    console.log(`📝 Input response: "${response}"`);

    // Don't add promos/quips to short responses or error messages
    if (!response || response.length < 30 || response.includes("apologize") || response.includes("not sure")) {
      console.log("🚫 Skipping promo/quip (short/error response)");
      return response;
    }

    // 1. Check for book promo trigger
    const bookTriggers = [
      'evolution', 'ai', 'artificial intelligence', 'machine learning', 'biology',
      'career', 'journey', 'background', 'scientist', 'book', 'write', 'author',
      'creative', 'creativity', 'robot', 'code', 'programming'
    ];

    const hasBookTrigger = bookTriggers.some(trigger =>
      userText.toLowerCase().includes(trigger) || response.toLowerCase().includes(trigger)
    );

    if (hasBookTrigger || Math.random() < this.bookPromoChance) {
      const randomPromo = selectRandomPromo();
      const finalResponse = `${response}\n\n${randomPromo}`;
      console.log("📚 Added book promo");
      console.log(`🎯 Final response with promo: "${finalResponse}"`);

      // Update debug hooks with final response
      if (__CHAT_DEBUG__.enabled) {
        __CHAT_DEBUG__.lastResponse = finalResponse;
      }

      return finalResponse;
    }

    // 2. If no promo, maybe add a quip (lower chance)
    if (Math.random() < 0.15) { // 15% chance if no promo was shown
      const randomQuip = selectRandomQuip();
      const finalResponse = `${response}\n\n*${randomQuip}*`;
      console.log("😄 Added funny quip");
      console.log(`🎯 Final response with quip: "${finalResponse}"`);

      // Update debug hooks with final response
      if (__CHAT_DEBUG__.enabled) {
        __CHAT_DEBUG__.lastResponse = finalResponse;
      }

      return finalResponse;
    }

    console.log("➡️ No additions, returning original response");

    // Update debug hooks with final response
    if (__CHAT_DEBUG__.enabled) {
      __CHAT_DEBUG__.lastResponse = response;
    }

    return response;
  }
}

class UIController {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.$ = (id) => shadowRoot.getElementById(id);
  }

  static createHTML() {
    return `
      <div class="container" role="application" aria-label="Local Chat">
        <div class="controls">
          <select id="modelSelect" aria-label="Model">
            ${MODELS.map(m => `<option value="${m.id}">${m.label}</option>`).join("")}
          </select>
          <button id="clearButton" title="Clear chat">Clear</button>
          <span id="status" role="status" aria-live="polite"></span>
        </div>
        <div id="messages" class="messages" aria-live="polite"></div>
        <form class="input-form" id="messageForm" autocomplete="off">
          <input id="messageInput" type="text" placeholder="Type and press Enter…" required
                 autocomplete="off" autocapitalize="none" autocorrect="off"
                 spellcheck="false" enterkeyhint="send"/>
          <button id="sendButton">Send</button>
        </form>
      </div>
    `;
  }

  setStatus(text) {
    this.$("status").textContent = text;
  }

  setControlsEnabled(enabled) {
    this.$("sendButton").disabled = !enabled;
    this.$("messageInput").disabled = !enabled;
  }

  getSelectedModel() {
    return this.$("modelSelect").value;
  }

  getMessageInput() {
    const input = this.$("messageInput");
    const value = input.value.trim();
    input.value = "";
    return value;
  }

  addMessage(role, content) {
    const messagesContainer = this.$("messages");
    const messageEl = document.createElement("div");
    messageEl.className = "message";
    messageEl.dataset.role = role;

    const formattedContent = this._formatMessageContent(content);
    messageEl.innerHTML = `<span class="sender">${role === "user" ? "you" : "ai"}</span>${formattedContent}`;

    messagesContainer.appendChild(messageEl);
    this._scrollToBottom();
    return messageEl;
  }

  updateMessage(element, content) {
    const sender = element.querySelector('.sender');
    const formattedContent = this._formatMessageContent(content);
    element.innerHTML = `${sender.outerHTML}${formattedContent}`;

    // Only auto-scroll if user hasn't manually scrolled up
    if (this._shouldAutoScroll()) {
      this._scrollToBottom();
    }
  }

  _scrollToBottom() {
    const messagesContainer = this.$("messages");
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  _formatMessageContent(content) {
    // Skip formatting for HTML content (like thinking dots)
    if (content.includes('<span class="thinking-dots"></span>')) {
      return content;
    }

    // Handle multi-paragraph content with better spacing
    let formatted = this._escapeHTML(content);

    // Convert double newlines to paragraph breaks
    formatted = formatted.replace(/\n\n+/g, '</p><p>');

    // If we have paragraphs, wrap the content
    if (formatted.includes('</p><p>')) {
      formatted = `<p>${formatted}</p>`;
    }

    return formatted;
  }

  clearMessages() {
    this.$("messages").innerHTML = "";
  }

  // Check if user has scrolled up and should auto-scroll
  _shouldAutoScroll() {
    const messagesContainer = this.$("messages");
    const threshold = 100; // pixels from bottom
    return (messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < threshold;
  }

  focus() {
    this.$("messageInput").focus();
  }

  _escapeHTML(text) {
    // First escape HTML entities
    let escaped = String(text).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    // Then parse markdown links [text](url) -> <a href="url" target="_blank" rel="noopener">text</a>
    return escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }
}

class AIChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.modelManager = new ModelManager();
    this.chatEngine = new ChatEngine();
    this.ui = new UIController(this.shadowRoot);
    this.hfToken = null;
  }

  // Static CSS cache
  static _cachedCSS = null;

  connectedCallback() {
    this.shadowRoot.innerHTML = UIController.createHTML();
    this._loadStyles();
    this._setupEventListeners();
    this._initializeToken();
    this._autoLoadDefaultModel();
  }

  async _loadStyles() {
    // Use cached CSS if available
    if (AIChat._cachedCSS) {
      const style = document.createElement("style");
      style.textContent = AIChat._cachedCSS;
      this.shadowRoot.prepend(style);
      return;
    }

    try {
      const response = await fetch("assets/chat.css");
      if (!response.ok) throw new Error("Styles not found");
      const css = await response.text();
      AIChat._cachedCSS = css; // Cache for future instances
      const style = document.createElement("style");
      style.textContent = css;
      this.shadowRoot.prepend(style);
    } catch (error) {
      console.error("Failed to load component styles:", error);
    }
  }

  _setupEventListeners() {
    this.ui.$("messageForm").addEventListener("submit", (e) => this._handleSubmit(e));
    this.ui.$("clearButton").addEventListener("click", () => this._clearChat());
    this.ui.$("modelSelect").addEventListener("change", () => this._loadSelectedModel());
  }

  _initializeToken() {
    try {
      const params = new URLSearchParams(location.search);
      const fromUrl = params.get("hf_token");
      const fromStore = localStorage.getItem("hf_token") || "";
      this.hfToken = fromUrl || fromStore || "";
    } catch { }
  }

  _autoLoadDefaultModel() {
    this.ui.addMessage("assistant", "🚀 Loading default model…");
    this.ui.$("modelSelect").value = MODELS[0].id;
    setTimeout(() => this._loadSelectedModel(), 100);
    this.ui.focus();
  }

  async _loadSelectedModel() {
    const modelId = this.ui.getSelectedModel();
    this.ui.setControlsEnabled(false);
    this.ui.setStatus(`Loading ${modelId}…`);

    try {
      const result = await this.modelManager.loadModel(modelId, this.hfToken);
      if (!result) return;

      this.ui.setStatus("Ready");
      const modelName = MODELS.find(m => m.id === modelId)?.label || modelId;
      const message = `✨ Loaded ${modelName}. Ask me anything about ${SITE_CONFIG.name}!`;
      const fallbackMsg = result.fallback ? "\n\n💡 Running on CPU for best compatibility." : "";
      this.ui.addMessage("assistant", message + fallbackMsg);
      this.ui.setControlsEnabled(true);
    } catch (error) {
      console.error(error);
      this.ui.setStatus("Load failed");
      this._handleLoadError(modelId);
      this.ui.setControlsEnabled(true);
    }
  }

  _handleLoadError(modelId) {
    this.ui.addMessage("assistant", "Failed to load model: " + modelId + ". Network or model issue. Try another model or browser.");
  }

  _clearChat() {
    this.chatEngine.clearHistory();
    this.ui.clearMessages();
    this.ui.addMessage("assistant", "Chat cleared. What would you like to know?");
    this.ui.focus();
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const userInput = this.ui.getMessageInput();
    if (!userInput) return;

    // Greeting handler for simple inputs
    const lowerInput = userInput.toLowerCase().trim();
    const greetings = ["hi", "hello", "hey", "yo", "heeey guy", "sup"];
    if (greetings.includes(lowerInput)) {
      this.chatEngine.addMessage("user", userInput);
      this.ui.addMessage("user", userInput);
      const cannedResponses = [
        `Hello! I'm a simple bot on ${SITE_CONFIG.name}'s site. You can ask about work, experience, or writing. What's on your mind?`,
        `Hey there! I'm here to answer questions about ${SITE_CONFIG.name}. Fire away!`,
        `Hi! Ask me something about ${SITE_CONFIG.name}'s background or projects.`
      ];
      const response = cannedResponses[Math.floor(Math.random() * cannedResponses.length)];
      this.chatEngine.addMessage("assistant", response);
      this.ui.addMessage("assistant", response);
      return; // Skip model generation
    }

    this.chatEngine.addMessage("user", userInput);
    this.ui.addMessage("user", userInput);

    if (!this.modelManager.pipe) {
      this.ui.addMessage("assistant", "Load a model first.");
      return;
    }

    this.ui.setControlsEnabled(false);
    this.ui.setStatus("Thinking…");
    const responseEl = this.ui.addMessage("assistant", '<span class="thinking-dots"></span>');

    try {
      await this._generateResponse(userInput, responseEl);
    } catch (error) {
      console.error(error);
      this.ui.updateMessage(responseEl, "Generation error. Please try again.");
      this.ui.setStatus("Error");
    } finally {
      this.ui.setControlsEnabled(true);
      this.ui.focus();
    }
  }

  async _generateResponse(userInput, responseEl) {
    const formatted = await this.chatEngine.formatPrompt(userInput, this.modelManager.tokenizer);
    if (CONFIG.DEBUG) console.log("Full prompt and context:", formatted);
    const genSeq = ++this.chatEngine._genSeq;
    let latestText = "";

    let lastScrollTime = 0;
    const scrollThrottle = 100; // ms

    const onUpdate = (chunk) => {
      if (this.chatEngine._genSeq !== genSeq) return;

      try {
        if (Array.isArray(chunk) && chunk[0]?.generated_text) {
          latestText = chunk[0].generated_text;
        } else if (chunk?.generated_text) {
          latestText = chunk.generated_text;
        } else if (chunk?.token?.text) {
          latestText += chunk.token.text;
        } else if (typeof chunk === "string") {
          latestText += chunk;
        }

        // Use raw output directly - no sanitization
        let display = latestText || "";
        if (formatted && display.startsWith(formatted)) {
          display = display.slice(formatted.length);
        }
        display = display.replace(/^\s*\.\.\.\s*/, "").trim();
        this.ui.updateMessage(responseEl, display || "…");

        // Throttled smooth scrolling during generation
        const now = Date.now();
        if (now - lastScrollTime > scrollThrottle) {
          if (this.ui._shouldAutoScroll()) {
            this.ui._scrollToBottom();
          }
          lastScrollTime = now;
        }
      } catch (error) {
        console.warn("Streaming callback error:", error);
      }
    };


    const result = await this.modelManager.generateText(formatted, onUpdate, this.chatEngine.currentParams);
    if (this.chatEngine._genSeq !== genSeq) return;

    const raw = result?.[0]?.generated_text ?? latestText ?? "";
    const full = raw || (result?.[0] ? String(result[0]) : "");
    // Use raw output directly - no sanitization
    let reply = full || "";
    if (formatted && reply.startsWith(formatted)) {
      reply = reply.slice(formatted.length);
    }
    reply = reply.replace(/^\s*\.\.\.\s*/, "").trim();
    console.log(`📥 Raw model output: "${reply}"`);

    // Finalize the response with a potential promo or quip
    reply = this.chatEngine.finalizeResponse(reply, userInput);

    if (CONFIG.DEBUG) {
      console.log("Raw model response:", raw);
      console.log("Full response:", full);
      console.log("Final reply with potential additions:", reply);
    }

    this.chatEngine.addMessage("assistant", reply);
    this.ui.updateMessage(responseEl, reply || "(no response)");
    this.ui.setStatus("");
  }
}

customElements.define("ai-chat", AIChat);