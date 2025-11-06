# AI Coding Assistant Instructions for Web-Based Keyboard Piano

## Project Overview
This is a **frontend-only web application** built with vanilla HTML5, CSS3, and JavaScript ES6+. It creates an interactive piano keyboard using the Web Audio API through Tone.js. The app runs entirely in the browser with no build process required.

## Architecture & Key Components

### Core Structure
- **`index.html`**: Single HTML file with embedded SVG for sheet music staves
- **`piano.js`**: ~1300 lines of vanilla JavaScript handling all logic
- **`styles.css`**: Responsive styling with CSS Grid/Flexbox and backdrop filters
- **No build tools**: Edit files directly, refresh browser to test

### Audio System (Tone.js)
- **7 synthesizer types**: Basic Synth, AM Synth, FM Synth, Duo Synth, Mono Synth, Membrane Synth, Metal Synth
- **ADSR envelope control**: Attack, Decay, Sustain, Release parameters
- **Real-time synthesis**: No pre-recorded samples, all audio generated dynamically
- **Polyphonic playback**: Multiple notes can sound simultaneously

### Interactive Features
- **Chromatic keyboard**: C2 to A6 range with visual white/black key layout
- **Dual input methods**: Mouse clicks + computer keyboard mapping
- **Sheet music display**: Real-time treble/bass clef notation rendering
- **Metronome**: BPM control with time signatures and visual beat indicators
- **Scale highlighter**: Visual guides for major/minor/pentatonic scales
- **Transpose control**: ±6 semitone pitch shifting

## Development Patterns & Conventions

### State Management
```javascript
// Settings persist automatically to localStorage
const STORAGE_KEYS = {
  VOLUME: 'piano_volume',
  SOUND: 'piano_sound',
  ADSR: 'piano_adsr',
  // ... etc
};

// Debounced saves prevent excessive localStorage writes
const saveVolumeDebounced = debounce((value) => {
  saveToStorage(STORAGE_KEYS.VOLUME, value);
}, 300);
```

### DOM Manipulation
```javascript
// Cache DOM elements at startup for performance
const piano = document.getElementById('piano');
const volumeSlider = document.getElementById('volume-slider');

// Use data attributes for note mapping
keyDiv.dataset.note = note; // e.g., "C4", "F#3"
```

### Event Handling
```javascript
// Feature toggles use class-based visibility
featureToggle.addEventListener('click', () => {
  modal.classList.toggle('hidden');
  toggle.classList.toggle('active');
  saveToStorage(STORAGE_KEYS.SHEET_VISIBLE, !modal.classList.contains('hidden'));
});
```

### Performance Optimizations
- **Object pooling** for particle effects (max 100 particles)
- **Debounced operations** for settings that trigger frequently
- **DocumentFragment** for bulk DOM insertions during piano creation
- **Event delegation** where appropriate

### Error Handling
```javascript
try {
  synth.triggerAttack(note);
} catch (error) {
  console.error('Error playing note:', error);
  // Continue execution - don't crash the app
}
```

## Keyboard Mapping System

### Computer Keyboard Layout
```javascript
const keyMap = {
  // Bottom row: Z-M (C2-B2)
  'KeyZ': 'C2', 'KeyX': 'D2', 'KeyC': 'E2', 'KeyV': 'F2', 'KeyB': 'G2', 'KeyN': 'A2', 'KeyM': 'B2',
  // Middle row: A-Enter (C3-G4)
  'KeyA': 'C3', 'KeyS': 'D3', 'KeyD': 'E3', 'KeyF': 'F3', 'KeyG': 'G3', 'KeyH': 'A3', 'KeyJ': 'B3',
  'KeyK': 'C4', 'KeyL': 'D4', 'Semicolon': 'E4', 'Quote': 'F4', 'Enter': 'G4',
  // Top row: Q-Backspace (C4-A6)
  'KeyQ': 'C4', 'KeyW': 'D4', 'KeyE': 'E4', 'KeyR': 'F4', 'KeyT': 'G4', 'KeyY': 'A4', 'KeyU': 'B4',
  'KeyI': 'C5', 'KeyO': 'D5', 'KeyP': 'E5', 'BracketLeft': 'F5', 'BracketRight': 'G5', 'Backslash': 'A5',
  // Number row: 1-Backspace (C5-A6)
  'Digit1': 'C5', 'Digit2': 'D5', 'Digit3': 'E5', 'Digit4': 'F5', 'Digit5': 'G5', 'Digit6': 'A5', 'Digit7': 'B5',
  'Digit8': 'C6', 'Digit9': 'D6', 'Digit0': 'E6', 'Minus': 'F6', 'Equal': 'G6', 'Backspace': 'A6'
};
```

### Note Generation
- **Chromatic scale**: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- **Range**: C2 (lowest) to A6 (highest)
- **Visual layout**: White keys (naturals) + black keys (sharps/flats) positioned correctly

## Modal System Architecture

### Feature Panels
All advanced features use a consistent modal pattern:
- **Sheet Music**: Real-time notation with treble/bass clefs
- **Metronome**: BPM slider, time signature selector, visual beat dots
- **ADSR**: Four envelope sliders with reset functionality
- **Scale**: Root note + scale type selectors for highlighting

### Toggle Behavior
```javascript
// Consistent pattern across all modals
modal.classList.toggle('hidden');
toggleButton.classList.toggle('active');
saveToStorage(visibilityKey, isVisible);
```

## Deployment & Docker

### Development
```bash
# Simply open index.html in any modern browser
# No server required for basic development
```

### Production
```bash
# Docker deployment
docker-compose up -d  # Runs on localhost:8080
```

### Container Setup
- **Base image**: nginx:alpine (lightweight)
- **Static serving**: All files served from `/usr/share/nginx/html/`
- **Caching**: 1-year cache headers for JS/CSS assets
- **Compression**: gzip enabled for text assets

## Common Tasks & Workflows

### Adding New Features
1. Add HTML structure to `index.html`
2. Add CSS styling to `styles.css`
3. Add JavaScript logic to `piano.js`
4. Add localStorage key to `STORAGE_KEYS`
5. Add loading/saving logic to `loadSettings()`
6. Test across different browsers

### Modifying Audio Behavior
1. Work with Tone.js API directly
2. Handle synth disposal/recreation for type changes
3. Update ADSR envelope application
4. Test polyphony and note release

### UI/UX Changes
1. Maintain responsive design principles
2. Use CSS custom properties for theming
3. Test touch/mobile interactions
4. Ensure accessibility (keyboard navigation, screen readers)

## Code Quality Guidelines

### JavaScript Style
- **ES6+ features**: Arrow functions, template literals, destructuring
- **Functional programming**: Pure functions where possible
- **Error resilience**: Graceful degradation, no crashes
- **Performance**: Minimize DOM queries, use caching

### CSS Organization
- **Component-based**: Each feature has dedicated styles
- **Responsive**: Mobile-first approach with flexbox/grid
- **Modern features**: backdrop-filter, CSS gradients, transforms
- **Performance**: Minimize repaints/reflows

### Commit Conventions
Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Code restructuring
- `chore:` - Maintenance

## Testing & Validation

### Manual Testing Checklist
- [ ] All keyboard mappings work
- [ ] Mouse clicks trigger correct notes
- [ ] All synth types load without errors
- [ ] Settings persist across browser sessions
- [ ] Responsive layout on different screen sizes
- [ ] Audio works in different browsers
- [ ] Modal toggles function correctly
- [ ] Sheet music displays accurately

### Browser Compatibility
- **Primary**: Chrome, Firefox, Edge, Safari (latest)
- **Fallbacks**: Graceful degradation for older browsers
- **Mobile**: Touch events supported where applicable

## Troubleshooting Common Issues

### Audio Not Working
- Check browser permissions for Web Audio API
- Ensure Tone.js loaded from CDN
- Verify synth initialization succeeded

### Settings Not Saving
- Check localStorage availability (not in private browsing)
- Verify STORAGE_KEYS constants match usage
- Check for localStorage quota exceeded

### Layout Issues
- Confirm viewport meta tag in HTML
- Test CSS transforms and scaling
- Verify responsive breakpoints

This codebase emphasizes **simplicity and performance** - keep changes lightweight and maintain the browser-native approach without introducing complex build tools or frameworks.</content>
<parameter name="filePath">e:\Project\web-based-keyboard-piano\.github\copilot-instructions.md