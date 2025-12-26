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

        // Advanced settings
        this.advancedMode = false;
        this.timeSignature = 4; // 4/4, 3/4, 2/4, 6/8
        this.subdivision = 1; // 1=none, 2=eighth, 3=triplets, 4=sixteenth

        // Tap Tempo
        this.tapTimes = [];
        this.tapHistoryArray = [];
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
        this.advancedToggle = document.getElementById('advanced-toggle');
        this.advancedPanel = document.getElementById('advanced-panel');
        this.tapHistoryEl = document.getElementById('tap-history');
        this.tapAvgValue = document.getElementById('tap-avg-value');
        this.tapStability = document.getElementById('tap-stability');
        this.tapResetBtn = document.getElementById('tap-reset-btn');

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

        // Advanced mode toggle
        this.advancedToggle.addEventListener('change', (e) => {
            this.advancedMode = e.target.checked;
            this.advancedPanel.classList.toggle('collapsed', !this.advancedMode);
        });

        // Time signature buttons
        document.querySelectorAll('.ts-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ts-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeSignature = parseInt(btn.dataset.ts);
                this.updateMeasureDisplay();
            });
        });

        // Subdivision buttons
        document.querySelectorAll('.sub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.subdivision = parseInt(btn.dataset.sub);
            });
        });

        // Tap reset button
        this.tapResetBtn.addEventListener('click', () => this.resetTapTempo());

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

    createClick(time, isAccent = false, isSubdivision = false) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Different sounds based on selection
        let volume = isAccent ? 0.7 : (isSubdivision ? 0.25 : 0.5);
        let duration = isSubdivision ? 0.03 : 0.05;

        switch (this.soundType) {
            case 'click':
                osc.frequency.value = isAccent ? 1200 : 1000;
                osc.type = 'sine';
                gain.gain.setValueAtTime(volume, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                osc.start(time);
                osc.stop(time + duration);
                break;
            case 'beep':
                osc.frequency.value = isAccent ? 1000 : 800;
                osc.type = 'square';
                gain.gain.setValueAtTime(volume * 0.6, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.5);
                osc.start(time);
                osc.stop(time + duration * 1.5);
                break;
            case 'woodblock':
                osc.frequency.value = isAccent ? 700 : 600;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(volume, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
                osc.start(time);
                osc.stop(time + 0.03);
                break;
            case 'digital':
                osc.frequency.value = isAccent ? 1500 : 1200;
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(volume * 0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                osc.start(time);
                osc.stop(time + 0.04);
                break;
        }

        // Visual and tactile feedback (only on main beats, not subdivisions)
        if (!isSubdivision) {
            const visualDelay = (time - this.audioContext.currentTime) * 1000;
            setTimeout(() => {
                this.flashBeat(isAccent);
                if (this.vibrationEnabled && 'vibrate' in navigator) {
                    navigator.vibrate(isAccent ? 80 : 50);
                }
                if (this.flashEnabled) {
                    this.triggerFlash();
                }
            }, Math.max(0, visualDelay));
        }
    }

    flashBeat(isAccent = false) {
        this.beatDot.classList.add('active');
        if (isAccent) {
            this.beatDot.style.transform = 'scale(1.5)';
        }
        setTimeout(() => {
            this.beatDot.classList.remove('active');
            this.beatDot.style.transform = '';
        }, 100);
    }

    triggerFlash() {
        document.body.classList.add('flash-active');
        setTimeout(() => document.body.classList.remove('flash-active'), 100);
    }

    updateMeasureDisplay() {
        const tsLabels = { 4: '4/4', 3: '3/4', 2: '2/4', 6: '6/8' };
        const label = tsLabels[this.timeSignature] || '4/4';
        document.querySelector('.measure-label').textContent = `Compás (${label})`;
    }

    scheduler() {
        const beatsPerMeasure = this.timeSignature;
        const subdivisionCount = this.subdivision;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            // Calculate current beat position in measure
            const beatInMeasure = ((this.beatCount - 1) % beatsPerMeasure) + 1;

            // Check if this is the first beat of a measure (accent)
            const isFirstBeat = beatInMeasure === 1;

            // For 6/8, beat 4 gets a medium accent
            const isMediumAccent = this.timeSignature === 6 && beatInMeasure === 4;

            // Schedule main beat
            this.createClick(this.nextNoteTime, isFirstBeat || isMediumAccent, false);

            // Schedule subdivisions
            if (subdivisionCount > 1) {
                const subdivInterval = 60.0 / (this.bpm * subdivisionCount);
                for (let i = 1; i < subdivisionCount; i++) {
                    this.createClick(this.nextNoteTime + subdivInterval * i, false, true);
                }
            }

            // Calculate interval to next beat
            let interval = 60.0 / this.bpm;

            // For 6/8, we treat it as 2 beats per measure with triplet subdivisions
            if (this.timeSignature === 6) {
                // In 6/8, each "beat" is a dotted quarter, so we have 2 beats per measure
                // But our BPM is still quarter notes, so we need to adjust
                interval = 60.0 / (this.bpm * 2 / 3);
            }

            this.beatCount++;
            this.nextNoteTime += interval;

            // Update measure counter
            if (this.beatCount % beatsPerMeasure === 0) {
                this.measureCount = (this.measureCount % 999) + 1;
                this.measureNumber.textContent = this.measureCount;
            }
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
        this.updateMeasureDisplay();
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
        this.beatDot.style.transform = '';

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

        // Remove taps older than 3 seconds
        this.tapTimes = this.tapTimes.filter(t => now - t < 3000);
        this.tapHistoryArray = this.tapHistoryArray.filter(t => now - t.time < 3000);

        this.tapTimes.push(now);
        this.tapHistoryArray.push({ time: now, bpm: null });

        // Clear previous timeout
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }

        // Reset tap times after 3 seconds of inactivity
        this.tapTimeout = setTimeout(() => {
            this.resetTapTempo();
        }, 3000);

        // Calculate BPM if we have at least 2 taps
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const tappedBpm = Math.round(60000 / avgInterval);

            // Store BPM for this tap
            this.tapHistoryArray[this.tapHistoryArray.length - 1].bpm = tappedBpm;

            // Only update if within valid range
            if (tappedBpm >= 40 && tappedBpm <= 220) {
                this.setBpm(tappedBpm);
            }

            this.updateTapDisplay(tappedBpm, intervals);
        }

        // Visual feedback
        this.tapTempoBtn.style.transform = 'scale(0.95)';
        setTimeout(() => this.tapTempoBtn.style.transform = '', 100);

        // Update advanced tap display
        this.updateAdvancedTapDisplay();
    }

    updateTapDisplay(currentBpm, intervals) {
        // Calculate stability
        if (intervals.length >= 3) {
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            const cv = (stdDev / avgInterval) * 100; // Coefficient of variation

            let stability = 'poor';
            if (cv < 3) stability = 'good';
            else if (cv < 8) stability = 'medium';

            this.tapStability.textContent = stability === 'good' ? '✓' : (stability === 'medium' ? '~' : '✗');
            this.tapStability.className = 'tap-stability ' + stability;
        }
    }

    updateAdvancedTapDisplay() {
        if (!this.advancedMode) return;

        const recentBpms = this.tapHistoryArray.slice(-8).filter(t => t.bpm !== null);
        if (recentBpms.length === 0) {
            this.tapHistoryEl.innerHTML = '<span class="tap-placeholder">Pulsa al ritmo...</span>';
            this.tapAvgValue.textContent = '--';
            this.tapStability.textContent = '';
            this.tapStability.className = 'tap-stability';
            return;
        }

        // Show BPM history
        this.tapHistoryEl.innerHTML = recentBpms.map(t =>
            `<span class="tap-bpm">${t.bpm}</span>`
        ).join('');

        // Calculate average
        const avg = Math.round(recentBpms.reduce((sum, t) => sum + t.bpm, 0) / recentBpms.length);
        this.tapAvgValue.textContent = avg;
    }

    resetTapTempo() {
        this.tapTimes = [];
        this.tapHistoryArray = [];
        this.tapHistoryEl.innerHTML = '<span class="tap-placeholder">Pulsa al ritmo...</span>';
        this.tapAvgValue.textContent = '--';
        this.tapStability.textContent = '';
        this.tapStability.className = 'tap-stability';
        this.updateAdvancedTapDisplay();

        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }
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
