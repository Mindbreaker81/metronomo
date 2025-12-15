class Metronome {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.nextNoteTime = 0;
        this.timerID = null;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25;
        
        this.bpmValue = document.getElementById('bpm-value');
        this.bpmSlider = document.getElementById('bpm-slider');
        this.bpmInput = document.getElementById('bpm-input');
        this.playBtn = document.getElementById('play-btn');
        this.btnIcon = document.getElementById('btn-icon');
        this.btnText = document.getElementById('btn-text');
        this.beatDot = document.getElementById('beat-dot');
        
        this.init();
    }
    
    init() {
        this.bpmSlider.addEventListener('input', (e) => this.setBpm(e.target.value));
        this.bpmInput.addEventListener('change', (e) => this.setBpm(e.target.value));
        this.playBtn.addEventListener('click', () => this.toggle());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            }
        });
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
        
        osc.frequency.value = 1000;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        osc.start(time);
        osc.stop(time + 0.05);
        
        const visualDelay = (time - this.audioContext.currentTime) * 1000;
        setTimeout(() => this.flashBeat(), Math.max(0, visualDelay));
    }
    
    flashBeat() {
        this.beatDot.classList.add('active');
        setTimeout(() => this.beatDot.classList.remove('active'), 100);
    }
    
    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.createClick(this.nextNoteTime);
            this.nextNoteTime += 60.0 / this.bpm;
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }
    
    start() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.isPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
        
        this.playBtn.classList.add('playing');
        this.btnIcon.textContent = '⏹';
        this.btnText.textContent = 'Detener';
    }
    
    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
        
        this.playBtn.classList.remove('playing');
        this.btnIcon.textContent = '▶';
        this.btnText.textContent = 'Iniciar';
        this.beatDot.classList.remove('active');
    }
    
    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Metronome();
});
