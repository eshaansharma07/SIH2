// Saathi Bol (साथी बोल) — SpeechSynthesis API Service for Rural Voice Read-Aloud

let cachedVoices = [];
let speechTimeout = null;
let keepAliveInterval = null;
let isSpeechActive = false;

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) cachedVoices = voices;
  } catch (_) {}
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Strips markdown, emojis, symbols, and formats currencies for clear, natural speech output
 */
export function cleanTextForSpeech(text, lang = 'en-IN') {
  if (!text) return '';
  let clean = String(text);

  // 1. Remove markdown bold, italic, code, headings, blockquotes
  clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
  clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');
  clean = clean.replace(/`{1,3}[^`]*`{1,3}/g, '');
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/^>\s+/gm, '');

  // 2. Remove markdown bullet points / numbered lists formatting
  clean = clean.replace(/^\s*[-*•]\s+/gm, '');
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');

  // 3. Remove markdown links: [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 4. Expand currency symbol for natural pronunciation
  clean = clean.replace(/₹\s*([0-9,]+)/g, (match, p1) => {
    const num = p1.replace(/,/g, '');
    return lang.startsWith('hi') ? `${num} रुपये` : `${num} rupees`;
  });

  // 5. Strip emojis and unicode pictorial symbols
  clean = clean.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');

  // 6. Replace slashes, dashes, colons with speech pauses
  clean = clean.replace(/[:;/|—–]/g, ', ');

  // 7. Collapse repeated whitespace and newlines
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

/**
 * Splits text into small chunks (~150-180 characters) to prevent browser TTS cut-offs
 */
export function chunkText(text, maxChunkLen = 160) {
  if (!text || text.length <= maxChunkLen) return [text].filter(Boolean);

  // Split on sentence boundaries: periods, exclamation marks, question marks, danda (।), newlines
  const rawSentences = text.split(/(?<=[.?!।\n])\s+/);
  const chunks = [];
  let current = '';

  for (const s of rawSentences) {
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxChunkLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      // If a single sentence exceeds maxChunkLen, split by commas or words
      if (s.length > maxChunkLen) {
        const subParts = s.split(/(?<=[,;])\s+/);
        let subCurrent = '';
        for (const p of subParts) {
          if ((subCurrent + ' ' + p).trim().length <= maxChunkLen) {
            subCurrent = (subCurrent + ' ' + p).trim();
          } else {
            if (subCurrent) chunks.push(subCurrent);
            subCurrent = p;
          }
        }
        if (subCurrent) chunks.push(subCurrent);
        current = '';
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(c => c && c.trim().length > 0);
}

/**
 * Locates best available voice for language with graceful fallback
 */
export function findMatchingVoice(lang = 'hi-IN') {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  if (!voices || voices.length === 0) return null;
  const prefix = lang.split('-')[0].toLowerCase();

  // 1. Exact match (e.g. 'hi-IN', 'en-IN', 'ta-IN')
  const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  // 2. Normalized match with _
  const exactNormalized = voices.find(v => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase());
  if (exactNormalized) return exactNormalized;

  // 3. Prefix match e.g. 'hi', 'pa', 'ta', 'en'
  const byPrefix = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (byPrefix) return byPrefix;

  // 4. Name match for Indian languages & English
  const namePatterns = {
    hi: /hindi|lekhak|neerja|madhav|swara|kalpana|hemant/i,
    pa: /punjabi|gurmukhi/i,
    bn: /bengali|bangla|bashir|tanisha/i,
    mr: /marathi|aarohi|manohar/i,
    ta: /tamil|valluvar|iniya/i,
    te: /telugu|mohan|chitra/i,
    gu: /gujarati|dhwani|niranjan/i,
    kn: /kannada|gagan|sapna/i,
    ml: /malayalam|midhun|sobha/i,
    or: /odia|oriya/i,
    as: /assamese|asomiya/i,
    en: /india|indian|ravi|heera|geeta|david|mark|zira|natural/i
  };

  if (namePatterns[prefix]) {
    const byName = voices.find(v => namePatterns[prefix].test(v.name));
    if (byName) return byName;
  }

  // 5. English Indian voice if native Indian voice is unavailable
  const enIndian = voices.find(v => v.lang.toLowerCase().includes('in') || /india|heera|ravi/i.test(v.name));
  if (enIndian) return enIndian;

  // 6. Default / system voice
  return voices.find(v => v.default) || voices[0] || null;
}

export function hasLanguageVoice(lang = 'hi-IN') {
  return isSpeechSupported();
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (speechTimeout) {
      clearTimeout(speechTimeout);
      speechTimeout = null;
    }
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    isSpeechActive = false;
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    if (typeof window !== 'undefined') {
      window._activeSpeechUtterance = null;
    }
  }
}

export function isSpeaking() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && (window.speechSynthesis.speaking || isSpeechActive);
}

/**
 * Plays speech using chunking and Chromium compatibility handling
 */
export function speak({
  text,
  lang = 'hi-IN',
  onStart,
  onEnd,
  onError
}) {
  if (!isSpeechSupported() || !text) {
    onError?.(new Error('Speech synthesis not supported or empty text'));
    return false;
  }

  // Strictly stop any current playback
  stopSpeech();

  const cleaned = cleanTextForSpeech(text, lang);
  if (!cleaned) {
    onEnd?.();
    return false;
  }

  const chunks = chunkText(cleaned, 160);
  if (chunks.length === 0) {
    onEnd?.();
    return false;
  }

  isSpeechActive = true;

  // Asynchronous start to ensure window.speechSynthesis.cancel() completes in Chromium
  speechTimeout = setTimeout(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Unlock audio context / unpause if frozen
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }

      let chunkIndex = 0;

      // Keep-alive interval for Chrome on Windows (resumes if Chrome pauses background speech)
      keepAliveInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      }, 3000);

      const playNext = () => {
        if (!isSpeechActive || chunkIndex >= chunks.length) {
          stopSpeech();
          onEnd?.();
          return;
        }

        const chunkTextStr = chunks[chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunkTextStr);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        const voice = findMatchingVoice(lang);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || lang;
        } else {
          utterance.lang = lang;
        }

        // Global reference prevents Chromium V8 garbage collection mid-speech
        if (typeof window !== 'undefined') {
          window._activeSpeechUtterance = utterance;
        }

        utterance.onstart = () => {
          if (chunkIndex === 0) {
            onStart?.();
          }
        };

        utterance.onend = () => {
          chunkIndex++;
          playNext();
        };

        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            stopSpeech();
            onEnd?.();
          } else {
            console.warn('[SaathiBol] Chunk speech notice:', e.error, chunkTextStr);
            // Move to next chunk rather than silently failing the whole message
            chunkIndex++;
            playNext();
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (speakErr) {
          console.warn('[SaathiBol] Direct speak error:', speakErr);
          chunkIndex++;
          playNext();
        }
      };

      playNext();
    } catch (err) {
      console.error('[SaathiBol] Failed during speech execution:', err);
      stopSpeech();
      onError?.(err);
    }
  }, 60);

  return true;
}
