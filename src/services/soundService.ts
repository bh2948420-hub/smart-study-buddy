// Sound notification service - plays sounds across the app

class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Load settings from localStorage
    const settings = localStorage.getItem('soundSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.enabled = parsed.enabled ?? true;
      this.volume = parsed.volume ?? 0.5;
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate a beep sound with specific frequency and duration
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  // Play a sequence of tones
  private playSequence(tones: { freq: number; dur: number; delay: number }[]) {
    if (!this.enabled) return;

    tones.forEach(({ freq, dur, delay }) => {
      setTimeout(() => this.playTone(freq, dur), delay * 1000);
    });
  }

  // Timer tick sound (soft click)
  playTick() {
    this.playTone(800, 0.05, 'square');
  }

  // Session complete sound (ascending melody)
  playSessionComplete() {
    this.playSequence([
      { freq: 523, dur: 0.15, delay: 0 },      // C5
      { freq: 659, dur: 0.15, delay: 0.15 },   // E5
      { freq: 784, dur: 0.3, delay: 0.3 },     // G5
    ]);
  }

  // Break complete sound (descending melody)
  playBreakComplete() {
    this.playSequence([
      { freq: 784, dur: 0.15, delay: 0 },      // G5
      { freq: 659, dur: 0.15, delay: 0.15 },   // E5
      { freq: 523, dur: 0.3, delay: 0.3 },     // C5
    ]);
  }

  // Achievement sound (triumphant)
  playAchievement() {
    this.playSequence([
      { freq: 523, dur: 0.1, delay: 0 },
      { freq: 659, dur: 0.1, delay: 0.1 },
      { freq: 784, dur: 0.1, delay: 0.2 },
      { freq: 1047, dur: 0.4, delay: 0.3 },
    ]);
  }

  // Notification sound (double beep)
  playNotification() {
    this.playSequence([
      { freq: 880, dur: 0.1, delay: 0 },
      { freq: 880, dur: 0.1, delay: 0.15 },
    ]);
  }

  // Warning sound (low tone)
  playWarning() {
    this.playTone(440, 0.3, 'sawtooth');
  }

  // Quiz correct answer
  playCorrect() {
    this.playSequence([
      { freq: 523, dur: 0.1, delay: 0 },
      { freq: 784, dur: 0.2, delay: 0.1 },
    ]);
  }

  // Quiz wrong answer
  playWrong() {
    this.playSequence([
      { freq: 300, dur: 0.2, delay: 0 },
      { freq: 250, dur: 0.3, delay: 0.2 },
    ]);
  }

  // Level up sound
  playLevelUp() {
    this.playSequence([
      { freq: 523, dur: 0.1, delay: 0 },
      { freq: 659, dur: 0.1, delay: 0.1 },
      { freq: 784, dur: 0.1, delay: 0.2 },
      { freq: 1047, dur: 0.15, delay: 0.3 },
      { freq: 1319, dur: 0.3, delay: 0.45 },
    ]);
  }

  // Settings
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  private saveSettings() {
    localStorage.setItem('soundSettings', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume,
    }));
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Send browser notification
  sendBrowserNotification(title: string, body: string, icon?: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }
}

// Export singleton instance
export const soundService = new SoundService();
