/** Standard DTMF pairs, so the keypad sounds like a real phone. */
const TONES = {
  1: [697, 1209],
  2: [697, 1336],
  3: [697, 1477],
  4: [770, 1209],
  5: [770, 1336],
  6: [770, 1477],
  7: [852, 1209],
  8: [852, 1336],
  9: [852, 1477],
  '*': [941, 1209],
  0: [941, 1336],
  '#': [941, 1477],
};

let audio = null;

export function playTone(key) {
  const pair = TONES[key];
  if (!pair) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const start = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
    gain.gain.setValueAtTime(0.08, start + 0.11);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
    gain.connect(audio.destination);
    for (const frequency of pair) {
      const oscillator = audio.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + 0.16);
    }
  } catch {
    // Audio is a nice-to-have; some browsers block it.
  }
}
