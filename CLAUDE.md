# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metronomo is a web-based metronome application built with vanilla JavaScript (no frameworks). It's a single-page application that uses the Web Audio API for precise timing and runs directly in the browser with zero dependencies.

## Architecture

The application follows a simple class-based architecture:

- **Metronome class** (`app.js`): Single class encapsulating all functionality
  - Uses Web Audio API's `AudioContext` for precise audio scheduling
  - Implements "look-ahead scheduling" pattern: `scheduler()` runs every 25ms and schedules audio events 100ms ahead
  - Manages Wake Lock API to prevent device sleep during playback
  - Handles iOS-specific audio unlocking via touch events

### Key Implementation Details

**Audio Scheduling**: The metronome uses a two-tier timing system:
- `lookahead` (25ms): How often the scheduler checks if notes need scheduling
- `scheduleAheadTime` (0.1s): How far ahead to schedule audio events

This pattern prevents audio glitches by pre-scheduling events with the Web Audio API's precise timing, rather than relying on `setInterval` alone.

**iOS Audio Workaround**: iOS requires user interaction to unlock `AudioContext`. The app handles this by:
1. Listening for `touchstart`/`touchend` events
2. Creating a silent buffer and playing it to unlock audio
3. Removing the listeners after first touch

**Wake Lock**: When playback starts, `navigator.wakeLock.request('screen')` is called to prevent the device from sleeping. The lock is released when playback stops.

## Development

### Running the Application

This is a static site with no build process:

```bash
# Serve locally (using any static file server)
python3 -m http.server 8000
# or
npx serve
```

Open `http://localhost:8000` in a browser.

### Testing

- Open directly in a browser (no build step required)
- Test on multiple browsers, especially Safari (iOS) due to audio context restrictions
- Test mobile functionality including touch events and wake lock

### Deployment

The project is configured for Vercel deployment via `vercel.json`:

```bash
vercel deploy
```

The `vercel.json` catch-all rewrite ensures all routes serve the single-page app.

## Code Conventions

- **Language**: UI text is in Spanish (`Iniciar`/`Detener` for play/stop)
- **BPM Range**: 40-220 beats per minute (enforced in `setBpm()`)
- **Keyboard Shortcut**: Space bar toggles play/pause
- **Class Structure**: All functionality in the `Metronome` class with clear method separation

### When Adding Features

1. Keep the zero-dependency approach - no npm packages
2. Consider mobile implications (touch events, wake lock, iOS audio restrictions)
3. Maintain the look-ahead scheduling pattern for any audio timing changes
4. Test Wake Lock behavior - it must be acquired/released with playback state
