// ========================================================
// WORD HUNT .IO - SYNTHWAVE & RETRO AUDIO ENGINE
// ========================================================

class SoundController {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
    this.isMuted = false;
    this.volume = 0.35;
    this.musicInterval = null;
    this.step = 0;
    this.tempoMs = 112; // Disco tempo (~134 BPM)

    // Synthwave scale notes
    this.A1 = 55.00; this.C2 = 65.41; this.D2 = 73.42; this.E2 = 82.41; this.F2 = 87.31; this.G2 = 98.00;
    this.A2 = 110.00; this.C3 = 130.81; this.D3 = 146.83; this.E3 = 164.81;
    this.A3 = 220.00; this.C4 = 261.63; this.D4 = 293.66; this.E4 = 329.63; this.F4 = 349.23; this.G4 = 392.00;
    this.B4 = 493.88; this.C5 = 523.25; this.E5 = 659.25;

    this.discoBass = [
      this.A1, this.A1, this.A2, this.A1, this.C2, this.C2, this.D2, this.E2,
      this.A1, this.A1, this.A2, this.A1, this.G2, this.G2, this.E2, this.D2,
      this.F2, this.F2, this.A2, this.F2, this.G2, this.G2, this.B4, this.G2,
      this.A1, this.A1, this.A2, this.A1, this.C3, this.C3, this.E3, this.D3
    ];

    this.discoChords = [
      [this.A3, this.C4, this.E4], 0, [this.A3, this.C4, this.E4], 0,
      [this.C4, this.E4, this.G4], 0, [this.F4, this.A3 * 2], 0,
      [this.A3, this.C4, this.E4], 0, [this.A3, this.C4, this.E4], 0,
      [this.G4, this.B4, this.C5], 0, [this.E4, this.G4, this.B4], 0
    ];
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // --- MÜZİK ÇALMA/DURDURMA ---
  toggleMusic() {
    this.initContext();
    if (this.isMusicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicPlaying;
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.step = 0;

    this.musicInterval = setInterval(() => {
      if (this.isMuted) return;
      
      const s = this.step;
      // Kick: her 4 adımda bir (dört dörtlük disco ritmi)
      if (s % 4 === 0) this.playKick();
      // Snare: 4. ve 12. adımlarda
      if (s % 8 === 4) this.playSnare();
      // Hi-hat
      if (s % 4 === 2) this.playDiscoHiHat(true);
      else if (s % 2 === 0) this.playDiscoHiHat(false);

      // Bassline
      const bassNote = this.discoBass[s % this.discoBass.length];
      this.playBassNote(bassNote);

      // Synth Chords
      const chord = this.discoChords[s % this.discoChords.length];
      if (chord) this.playSynthChord(chord);

      this.step++;
    }, this.tempoMs);
  }

  stopMusic() {
    if (!this.isMusicPlaying) return;
    clearInterval(this.musicInterval);
    this.musicInterval = null;
    this.isMusicPlaying = false;
  }

  // --- ENSTRÜMANLAR ---
  playKick() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.16);
    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.16);
  }

  playSnare() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playDiscoHiHat(isOpen = false) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = isOpen ? 0.14 : 0.04;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime((isOpen ? 0.05 : 0.03) * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playSynthChord(chord) {
    if (this.isMuted || !this.ctx || !chord) return;
    const t = this.ctx.currentTime;
    chord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.035 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(t + 0.19);
    });
  }

  playBassNote(freq) {
    if (this.isMuted || !this.ctx || !freq) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.14 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.13);
  }

  // --- OYUN İÇİ SES EFEKTLERİ ---
  playTileFlip(index = 0) {
    if (this.isMuted) return;
    this.initContext();
    const freq = 350 + (index * 60);
    this.playTone(freq, 0.12, 'triangle', 0.22);
  }

  playCorrectGuess(combo = 1) {
    if (this.isMuted) return;
    this.initContext();
    const baseFreq = 440 + Math.min(combo * 60, 400);
    const arpeggio = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0];
    arpeggio.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.25, 'sawtooth', 0.28);
      }, idx * 65);
    });
  }

  playWrongGuess() {
    if (this.isMuted) return;
    this.initContext();
    this.playTone(130, 0.2, 'sawtooth', 0.35);
    setTimeout(() => {
      this.playTone(95, 0.28, 'sawtooth', 0.3);
    }, 90);
  }

  playComboFever() {
    if (this.isMuted) return;
    this.initContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.3), i * 80);
    });
  }

  playTick() {
    if (this.isMuted) return;
    this.initContext();
    this.playTone(800, 0.03, 'sine', 0.08);
  }

  playWarningTick() {
    if (this.isMuted) return;
    this.initContext();
    this.playTone(950, 0.06, 'sawtooth', 0.18);
  }

  playReaction() {
    if (this.isMuted) return;
    this.initContext();
    this.playTone(600, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(900, 0.1, 'sine', 0.2), 40);
  }

  playVictory() {
    if (this.isMuted) return;
    this.initContext();
    const fanfare = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.5 }
    ];
    fanfare.forEach((n, i) => {
      setTimeout(() => this.playTone(n.f, n.d, 'triangle', 0.35), i * 140);
    });
  }

  playTone(freq, duration = 0.2, type = 'sine', volume = 0.2) {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + duration);
  }
}

// Global ses nesnesi
const sound = new SoundController();
