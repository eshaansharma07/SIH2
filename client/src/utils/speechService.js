// Saathi Bol (साथी बोल) — SpeechSynthesis API Service for Rural Voice Read-Aloud

let cachedVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
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

export function findMatchingVoice(lang = 'hi-IN') {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  const prefix = lang.split('-')[0].toLowerCase();

  // 1. Exact match
  const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  // 2. Prefix match e.g. 'hi'
  const byPrefix = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (byPrefix) return byPrefix;

  // 3. Name match for Hindi
  if (prefix === 'hi') {
    const byName = voices.find(v => /hindi|lekhak|neerja|madhav/i.test(v.name));
    if (byName) return byName;
  }

  // 4. Default / system voice
  return voices.find(v => v.default) || voices[0] || null;
}

export function hasLanguageVoice(lang = 'hi-IN') {
  if (!isSpeechSupported()) return false;
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  if (voices.length === 0) return true; // Voices might still load asynchronously
  const prefix = lang.split('-')[0].toLowerCase();
  return voices.some(v => v.lang.toLowerCase().startsWith(prefix) || (prefix === 'hi' && /hindi/i.test(v.name)));
}

let activeUtterance = null;

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

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

  // Strictly cancel any active or overlapping speech
  stopSpeech();

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Rural-friendly pacing
    utterance.pitch = 1.0;

    const voice = findMatchingVoice(lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[SaathiBol] Speech synthesis error:', e.error);
        onError?.(e);
      } else {
        onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('[SaathiBol] Failed to speak utterance:', err);
    onError?.(err);
    return false;
  }
}
