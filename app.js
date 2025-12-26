class Metronome {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.beatCount = 0;
        this.measureCount = 1;
        this.nextNoteTime = 0;
        this.timerID = null;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25;
        this.wakeLock = null;

        // Settings
        this.soundType = 'click';
        this.vibrationEnabled = false;
        this.flashEnabled = false;

        // Tap Tempo
        this.tapTimes = [];
        this.tapTimeout = null;

        // Presets
        this.presets = JSON.parse(localStorage.getItem('metronomePresets')) || [];

        // Theme
        this.currentTheme = localStorage.getItem('metronomeTheme') || 'dark';

        // DOM Elements
        this.bpmValue = document.getElementById('bpm-value');
        this.bpmSlider = document.getElementById('bpm-slider');
        this.bpmInput = document.getElementById('bpm-input');
        this.playBtn = document.getElementById('play-btn');
        this.btnIcon = document.getElementById('btn-icon');
        this.btnText = document.getElementById('btn-text');
        this.beatDot = document.getElementById('beat-dot');
        this.measureNumber = document.getElementById('measure-number');
        this.soundSelect = document.getElementById('sound-select');
        this.vibrationToggle = document.getElementById('vibration-toggle');
        this.flashToggle = document.getElementById('flash-toggle');
        this.tapTempoBtn = document.getElementById('tap-tempo-btn');
        this.presetsList = document.getElementById('presets-list');
        this.savePresetBtn = document.getElementById('save-preset-btn');
        this.themeToggle = document.getElementById('theme-toggle');

        this.init();
    }

    init() {
        // Initialize theme
        this.applyTheme(this.currentTheme);

        // BPM controls
        this.bpmSlider.addEventListener('input', (e) => this.setBpm(e.target.value));
        this.bpmInput.addEventListener('change', (e) => this.setBpm(e.target.value));

        // Play button
        this.playBtn.addEventListener('click', () => this.toggle());

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Sound selector
        this.soundSelect.addEventListener('change', (e) => {
            this.soundType = e.target.value;
        });

        // Vibration toggle
        this.vibrationToggle.addEventListener('change', (e) => {
            this.vibrationEnabled = e.target.checked;
        });

        // Flash toggle
        this.flashToggle.addEventListener('change', (e) => {
            this.flashEnabled = e.target.checked;
        });

        // Tap Tempo
        this.tapTempoBtn.addEventListener('click', () => this.handleTap());

        // Presets
        this.savePresetBtn.addEventListener('click', () => this.savePreset());
        this.renderPresets();

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // iOS: unlock audio on first touch anywhere
        const unlockAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            // Play silent buffer to unlock
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
        };

        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('touchend', unlockAudio);
    }

    setBpm(value) {
        this.bpm = Math.min(220, Math.max(40, parseInt(value) || 120));
        this.bpmValue.textContent = this.bpm;
        this.bpmSlider.value = this.bpm;
        this.bpmInput.value = this.bpm;
    }

    createClick(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Different sounds based on selection
        switch (this.soundType) {
            case 'click':
                osc.frequency.value = 1000;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                osc.start(time);
                osc.stop(time + 0.05);
                break;
            case 'beep':
                osc.frequency.value = 800;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
                osc.start(time);
                osc.stop(time + 0.08);
                break;
            case 'woodblock':
                osc.frequency.value = 600;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.6, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
                osc.start(time);
                osc.stop(time + 0.03);
                break;
            case 'digital':
                osc.frequency.value = 1200;
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.25, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                osc.start(time);
                osc.stop(time + 0.04);
                break;
        }

        // Visual and tactile feedback
        const visualDelay = (time - this.audioContext.currentTime) * 1000;
        setTimeout(() => {
            this.flashBeat();
            if (this.vibrationEnabled && 'vibrate' in navigator) {
                navigator.vibrate(50);
            }
            if (this.flashEnabled) {
                this.triggerFlash();
            }
        }, Math.max(0, visualDelay));
    }

    flashBeat() {
        this.beatDot.classList.add('active');
        setTimeout(() => this.beatDot.classList.remove('active'), 100);
    }

    triggerFlash() {
        document.body.classList.add('flash-active');
        setTimeout(() => document.body.classList.remove('flash-active'), 100);
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.createClick(this.nextNoteTime);
            this.beatCount++;

            // Update measure counter every 4 beats
            if (this.beatCount % 4 === 0) {
                this.measureCount = (this.measureCount % 999) + 1;
                this.measureNumber.textContent = this.measureCount;
            }

            this.nextNoteTime += 60.0 / this.bpm;
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    async start() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.beatCount = 0;
        this.measureCount = 1;
        this.measureNumber.textContent = this.measureCount;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();

        this.playBtn.classList.add('playing');
        this.btnIcon.textContent = '⏹';
        this.btnText.textContent = 'Detener';

        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake Lock error:', err);
        }
    }

    async stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);

        this.playBtn.classList.remove('playing');
        this.btnIcon.textContent = '▶';
        this.btnText.textContent = 'Iniciar';
        this.beatDot.classList.remove('active');

        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
            } catch (err) {
                console.log('Wake Lock release error:', err);
            }
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    handleTap() {
        const now = Date.now();

        // Remove taps older than 2 seconds
        this.tapTimes = this.tapTimes.filter(t => now - t < 2000);

        this.tapTimes.push(now);

        // Clear previous timeout
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }

        // Reset tap times after 2 seconds of inactivity
        this.tapTimeout = setTimeout(() => {
            this.tapTimes = [];
        }, 2000);

        // Calculate BPM if we have at least 2 taps
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const tappedBpm = Math.round(60000 / avgInterval);

            // Only update if within valid range
            if (tappedBpm >= 40 && tappedBpm <= 220) {
                this.setBpm(tappedBpm);
            }
        }

        // Visual feedback
        this.tapTempoBtn.style.transform = 'scale(0.95)';
        setTimeout(() => this.tapTempoBtn.style.transform = '', 100);
    }

    savePreset() {
        const bpm = this.bpm;

        // Check if already exists
        if (this.presets.includes(bpm)) {
            return;
        }

        // Limit to 8 presets
        if (this.presets.length >= 8) {
            this.presets.pop();
        }

        this.presets.push(bpm);
        this.presets.sort((a, b) => a - b);
        localStorage.setItem('metronomePresets', JSON.stringify(this.presets));
        this.renderPresets();

        // Visual feedback
        this.savePresetBtn.style.transform = 'scale(1.1)';
        setTimeout(() => this.savePresetBtn.style.transform = '', 200);
    }

    deletePreset(bpm) {
        this.presets = this.presets.filter(p => p !== bpm);
        localStorage.setItem('metronomePresets', JSON.stringify(this.presets));
        this.renderPresets();
    }

    renderPresets() {
        if (this.presets.length === 0) {
            this.presetsList.innerHTML = '<span class="no-presets">Sin presets</span>';
            return;
        }

        this.presetsList.innerHTML = this.presets.map(bpm => `
            <button class="preset-btn" data-bpm="${bpm}">
                <span>${bpm}</span>
                <span class="delete-preset">&times;</span>
            </button>
        `).join('');

        // Add event listeners
        this.presetsList.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-preset')) {
                    e.stopPropagation();
                    this.deletePreset(parseInt(btn.dataset.bpm));
                } else {
                    this.setBpm(parseInt(btn.dataset.bpm));
                }
            });
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('metronomeTheme', this.currentTheme);
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        document.body.className = theme + '-theme';
        this.themeToggle.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Metronome();

    // Instructions toggle
    const instructionsToggle = document.getElementById('instructions-toggle');
    const instructionsContent = document.getElementById('instructions-content');

    instructionsToggle.addEventListener('click', () => {
        instructionsContent.classList.toggle('collapsed');
        instructionsToggle.classList.toggle('active');
    });
});
