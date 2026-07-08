/**
 * Procedurally synthesized split-flap "clack" sound via Web Audio API.
 * No external mp3 assets needed (and each play is randomized in pitch/
 * duration/timing so repeated flaps never sound identical). A short flap
 * plays for a 1-step character change; a "long" flip (many steps through
 * the flap sequence) gets a rapid multi-clack burst. Each clack layers a
 * higher "flutter" click with a lower "thunk" for body, closer to the
 * real Vestaboard's mechanical sound.
 */
export class FlapSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private volume = 0.85;
  private activeVoices = 0;

  /** Must be called from a user gesture (e.g. first Send click) to unlock audio. */
  init() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : this.volume;

    // A compressor gives us headroom to push individual clacks louder
    // without a full-board update (dozens of simultaneous clacks) clipping.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.08;

    gain.connect(compressor);
    compressor.connect(ctx.destination);

    this.ctx = ctx;
    this.masterGain = gain;
    this.noiseBuffer = this.buildNoiseBuffer(ctx);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.15;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Single mechanical clack: a papery high-freq flutter layered with a
   * lower thunk for body, randomized tone for natural variation. */
  private clack(when: number, gainScale: number) {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    // High "flutter" layer — the plastic-card-flipping sound.
    const flutter = ctx.createBufferSource();
    flutter.buffer = this.noiseBuffer;
    const flutterFilter = ctx.createBiquadFilter();
    flutterFilter.type = "bandpass";
    flutterFilter.frequency.value = 1600 + Math.random() * 1000;
    flutterFilter.Q.value = 1.0 + Math.random() * 0.8;
    const flutterEnv = ctx.createGain();
    const flutterPeak = (0.85 + Math.random() * 0.35) * gainScale;
    const flutterDecay = 0.05 + Math.random() * 0.03;
    flutterEnv.gain.setValueAtTime(0, when);
    flutterEnv.gain.linearRampToValueAtTime(flutterPeak, when + 0.003);
    flutterEnv.gain.exponentialRampToValueAtTime(0.001, when + flutterDecay);
    flutter.connect(flutterFilter);
    flutterFilter.connect(flutterEnv);
    flutterEnv.connect(this.masterGain);
    flutter.start(when);
    flutter.stop(when + flutterDecay + 0.02);

    // Low "thunk" layer — the mechanical body/impact.
    const thunk = ctx.createBufferSource();
    thunk.buffer = this.noiseBuffer;
    const thunkFilter = ctx.createBiquadFilter();
    thunkFilter.type = "lowpass";
    thunkFilter.frequency.value = 280 + Math.random() * 220;
    const thunkEnv = ctx.createGain();
    const thunkPeak = (0.6 + Math.random() * 0.25) * gainScale;
    const thunkDecay = 0.035 + Math.random() * 0.02;
    thunkEnv.gain.setValueAtTime(0, when);
    thunkEnv.gain.linearRampToValueAtTime(thunkPeak, when + 0.002);
    thunkEnv.gain.exponentialRampToValueAtTime(0.001, when + thunkDecay);
    thunk.connect(thunkFilter);
    thunkFilter.connect(thunkEnv);
    thunkEnv.connect(this.masterGain);
    thunk.start(when);
    thunk.stop(when + thunkDecay + 0.02);

    this.activeVoices++;
    flutter.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  /**
   * Play `steps` sequential clacks for one tile flipping through `steps`
   * positions (fast repeated clacks), starting at `delaySec` from now.
   */
  playTileFlip(steps: number, delaySec: number, concurrentTiles: number) {
    if (!this.ctx || this.muted || steps <= 0) return;
    const now = this.ctx.currentTime;
    const clackCount = Math.min(steps, 14); // cap very long flips
    const stepGap = steps > 8 ? 0.028 : 0.055; // long flips clack faster
    // Headroom scaling so 100 simultaneous tiles don't clip even with the
    // compressor; single/few-tile flips stay at full loudness.
    const gainScale = Math.min(1, 5 / Math.max(1, concurrentTiles)) ** 0.5;

    for (let i = 0; i < clackCount; i++) {
      const jitter = (Math.random() - 0.5) * 0.01;
      this.clack(now + delaySec + i * stepGap + jitter, gainScale);
    }
  }
}

export const flapSoundEngine = new FlapSoundEngine();
