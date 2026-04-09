/**
 * Procedural Sound System using Web Audio API
 * Enhanced for more "fun" arcade-style feedback
 */

let audioCtx: AudioContext | null = null;
let isInteracted = false;

if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    if (isInteracted) return;
    isInteracted = true;
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
  };
  window.addEventListener('click', handleInteraction);
  window.addEventListener('keydown', handleInteraction);
  window.addEventListener('touchstart', handleInteraction);
}

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported', e);
      return null;
    }
  }
  
  if (isInteracted && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const createOscillator = (freq: number, type: OscillatorType = 'sine', gainVal: number = 0.1) => {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);

  return { osc, gain, ctx };
};

/**
 * Click sound: Percussive double-tap
 */
export const clickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const sound1 = createOscillator(1200, 'sine', 0.1);
  if (sound1) {
    const { osc, gain } = sound1;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  const sound2 = createOscillator(150, 'triangle', 0.15);
  if (sound2) {
    const { osc: osc2, gain: gain2 } = sound2;
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.start(now);
    osc2.stop(now + 0.08);
  }
};

/**
 * Hover sound: Tiny playful blip
 */
export const hoverSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sound = createOscillator(800, 'sine', 0.03);
  if (sound) {
    const { osc, gain } = sound;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.start(now);
    osc.stop(now + 0.02);
  }
};

/**
 * Bet sound: Quick rising "whoop"
 */
export const betSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sound = createOscillator(200, 'square', 0.1);
  if (!sound) return;
  const { osc, gain } = sound;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  osc.disconnect();
  osc.connect(filter);
  filter.connect(gain);

  osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  osc.start(now);
  osc.stop(now + 0.15);
};

/**
 * Win sound: Rapid minor-to-major arpeggio
 */
export const winSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const sound = createOscillator(freq, 'sine', 0.1);
    if (!sound) return;
    const { osc, gain } = sound;
    const start = now + i * 0.05;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    osc.start(start);
    osc.stop(start + 0.2);
  });
};

/**
 * Mini-win sound: Snappy double-blip
 */
export const miniWinSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const sound = createOscillator(freq, 'sine', 0.1);
    if (!sound) return;
    const { osc, gain } = sound;
    const start = now + i * 0.05;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    osc.start(start);
    osc.stop(start + 0.1);
  });
};

/**
 * Lose sound: Gritty descending slide
 */
export const loseSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sound = createOscillator(400, 'sawtooth', 0.1);
  if (!sound) return;
  const { osc, gain } = sound;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
  
  osc.disconnect();
  osc.connect(filter);
  filter.connect(gain);

  osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  
  osc.start(now);
  osc.stop(now + 0.3);
};

/**
 * Mini-lose sound: Short sad tritone
 */
export const miniLoseSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [440, 311.13].forEach((freq, i) => {
    const sound = createOscillator(freq, 'triangle', 0.1);
    if (!sound) return;
    const { osc, gain } = sound;
    const start = now + i * 0.1;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    osc.start(start);
    osc.stop(start + 0.2);
  });
};

/**
 * Game Over sound: 4-note descending motif
 */
export const gameOverSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
  
  notes.forEach((freq, i) => {
    const sound = createOscillator(freq, 'triangle', 0.15);
    if (!sound) return;
    const { osc, gain } = sound;
    const start = now + i * 0.15;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.5);
  });
};
