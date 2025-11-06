// Check if Tone.js is loaded
if (typeof Tone === 'undefined') {
  console.error('Tone.js library failed to load. Please check your internet connection.');
  alert('Audio library failed to load. Please refresh the page.');
  throw new Error('Tone.js library not loaded');
}

let synth;
try {
  synth = new Tone.PolySynth(Tone.Synth, {
    envelope: {
      attack: 0.001,
      decay: 0,
      sustain: 1,
      release: 1.5
    }
  }).toDestination();
  synth.volume.value = -12;
} catch (error) {
  console.error('Error initializing synthesizer:', error);
  alert('Failed to initialize audio. Please refresh the page.');
  throw error;
}

// Cache DOM elements
const piano = document.getElementById('piano');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');
const soundSelector = document.getElementById('sound-selector');
const transposeSlider = document.getElementById('transpose-slider');
const transposeValue = document.getElementById('transpose-value');

// Feature toggle elements
const sheetModalToggle = document.getElementById('sheet-modal-toggle');
const sheetModal = document.getElementById('sheet-modal');
const metronomeModalToggle = document.getElementById('metronome-modal-toggle');
const metronomeModal = document.getElementById('metronome-modal');
const adsrModalToggle = document.getElementById('adsr-modal-toggle');
const adsrModal = document.getElementById('adsr-modal');
const scaleModalToggle = document.getElementById('scale-modal-toggle');
const scaleModal = document.getElementById('scale-modal');

// Metronome DOM elements
const metronomeToggle = document.getElementById('metronome-toggle');
const bpmSlider = document.getElementById('bpm-slider');
const bpmValue = document.getElementById('bpm-value');
const metronomeVolumeSlider = document.getElementById('metronome-volume-slider');
const metronomeVolumeValue = document.getElementById('metronome-volume-value');
const timeSignatureSelect = document.getElementById('time-signature');
const beatDots = document.querySelectorAll('.beat-dot');

// ADSR DOM elements
const attackSlider = document.getElementById('attack-slider');
const attackValue = document.getElementById('attack-value');
const decaySlider = document.getElementById('decay-slider');
const decayValue = document.getElementById('decay-value');
const sustainSlider = document.getElementById('sustain-slider');
const sustainValue = document.getElementById('sustain-value');
const releaseSlider = document.getElementById('release-slider');
const releaseValue = document.getElementById('release-value');
const sustainDurationSlider = document.getElementById('sustain-duration-slider');
const sustainDurationValue = document.getElementById('sustain-duration-value');
const adsrResetBtn = document.getElementById('adsr-reset');

// Scale DOM elements
const scaleRootSelect = document.getElementById('scale-root');
const scaleTypeSelect = document.getElementById('scale-type');

// Sheet music DOM elements
const notesContainer = document.getElementById('notes-container');
const clearSheetBtn = document.getElementById('clear-sheet');

// Particle pool for reuse
const particlePool = [];
const MAX_POOL_SIZE = 100;
const activeParticles = new Set();

// Metronome state
let metronomeActive = false;
let metronomeBPM = 120;
let metronomeTimeSignature = { beats: 4, division: 4 };
let currentBeat = 0;

// ADSR state
let adsrEnvelope = {
  attack: 0.001,
  decay: 0,
  sustain: 1,
  release: 1.5
};

// Default ADSR values for reset
const DEFAULT_ADSR = {
  attack: 0.001,
  decay: 0,
  sustain: 1,
  release: 1.5
};

// Default sustain duration
const DEFAULT_SUSTAIN_DURATION = 1000; // 1 second

// Scale highlighting state
let currentScale = {
  root: 'C',
  type: 'none'
};

// Transpose state
let transposeValue_state = 0;

// Local Storage keys
const STORAGE_KEYS = {
  VOLUME: 'piano_volume',
  SOUND: 'piano_sound',
  BPM: 'metronome_bpm',
  METRONOME_VOLUME: 'metronome_volume',
  TIME_SIGNATURE: 'time_signature',
  ADSR: 'piano_adsr',
  SUSTAIN_DURATION: 'piano_sustain_duration',
  SCALE: 'piano_scale',
  TRANSPOSE: 'piano_transpose',
  SHEET_VISIBLE: 'sheet_visible',
  METRONOME_VISIBLE: 'metronome_visible',
  ADSR_VISIBLE: 'adsr_visible',
  SCALE_VISIBLE: 'scale_visible'
};

// Create metronome synth (using MembraneSynth for percussion-like sound)
let metronomeClickHigh, metronomeClickLow;
try {
  metronomeClickHigh = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 2,
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0
    }
  }).toDestination();
  metronomeClickHigh.volume.value = -10;

  metronomeClickLow = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 2,
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0
    }
  }).toDestination();
  metronomeClickLow.volume.value = -10;
} catch (error) {
  console.error('Error initializing metronome:', error);
}

// Local Storage functions
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Handle QuotaExceededError, SecurityError (private browsing), etc.
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Cannot save settings.');
    } else if (e.name === 'SecurityError') {
      console.warn('localStorage access denied (private browsing mode?).');
    } else {
      console.error('Error saving to localStorage:', e);
    }
    return false;
  }
}

function loadFromStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    if (e.name === 'SecurityError') {
      console.warn('localStorage access denied (private browsing mode?).');
    } else if (e instanceof SyntaxError) {
      console.warn(`Invalid JSON in localStorage for key "${key}". Using default value.`);
    } else {
      console.error('Error loading from localStorage:', e);
    }
    return defaultValue;
  }
}

// Scale definitions (intervals in semitones from root)
const scalePatterns = {
  'none': [],
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'pentatonic': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const noteToSemitone = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

// Debounce utility for performance
function debounce(func, wait) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

// Load settings from localStorage
function loadSettings() {
  // Load ADSR first (before recreating synth)
  const savedADSR = loadFromStorage(STORAGE_KEYS.ADSR, adsrEnvelope);
  adsrEnvelope = savedADSR;
  attackSlider.value = savedADSR.attack;
  attackValue.textContent = `${savedADSR.attack.toFixed(3)}s`;
  decaySlider.value = savedADSR.decay;
  decayValue.textContent = `${savedADSR.decay.toFixed(2)}s`;
  sustainSlider.value = savedADSR.sustain;
  sustainValue.textContent = savedADSR.sustain.toFixed(2);
  releaseSlider.value = savedADSR.release;
  releaseValue.textContent = `${savedADSR.release.toFixed(1)}s`;
  
  // Load sustain duration
  sustainDuration = loadFromStorage(STORAGE_KEYS.SUSTAIN_DURATION, DEFAULT_SUSTAIN_DURATION);
  const durationSeconds = sustainDuration / 1000;
  sustainDurationSlider.value = durationSeconds;
  sustainDurationValue.textContent = durationSeconds >= 30 ? '∞' : `${durationSeconds.toFixed(1)}s`;
  
  // Load volume
  const savedVolume = loadFromStorage(STORAGE_KEYS.VOLUME, -12);
  volumeSlider.value = savedVolume;
  volumeValue.textContent = `${savedVolume} dB`;
  
  // Load transpose
  transposeValue_state = loadFromStorage(STORAGE_KEYS.TRANSPOSE, 0);
  transposeSlider.value = transposeValue_state;
  transposeValue.textContent = transposeValue_state > 0 ? `+${transposeValue_state}` : transposeValue_state;
  
  // Load sound and recreate synth with saved type
  const savedSound = loadFromStorage(STORAGE_KEYS.SOUND, 'Synth');
  soundSelector.value = savedSound;
  
  // Recreate synth with the saved sound type
  synth.dispose();
  switch (savedSound) {
    case 'AMSynth':
      synth = new Tone.PolySynth(Tone.AMSynth).toDestination();
      break;
    case 'FMSynth':
      synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
      break;
    case 'DuoSynth':
      synth = new Tone.PolySynth(Tone.DuoSynth).toDestination();
      break;
    case 'MonoSynth':
      synth = new Tone.PolySynth(Tone.MonoSynth).toDestination();
      break;
    case 'MembraneSynth':
      synth = new Tone.PolySynth(Tone.MembraneSynth).toDestination();
      break;
    case 'MetalSynth':
      synth = new Tone.PolySynth(Tone.MetalSynth).toDestination();
      break;
    default:
      synth = new Tone.PolySynth(Tone.Synth, {
        envelope: adsrEnvelope
      }).toDestination();
  }
  synth.volume.value = savedVolume;
  
  // Apply ADSR to the newly created synth
  updateSynthADSR();
  
  // Load metronome settings
  metronomeBPM = loadFromStorage(STORAGE_KEYS.BPM, 120);
  bpmSlider.value = metronomeBPM;
  bpmValue.textContent = `${metronomeBPM} BPM`;
  
  const savedMetronomeVolume = loadFromStorage(STORAGE_KEYS.METRONOME_VOLUME, -10);
  metronomeClickHigh.volume.value = savedMetronomeVolume;
  metronomeClickLow.volume.value = savedMetronomeVolume;
  metronomeVolumeSlider.value = savedMetronomeVolume;
  metronomeVolumeValue.textContent = `${savedMetronomeVolume} dB`;
  
  const savedTimeSignature = loadFromStorage(STORAGE_KEYS.TIME_SIGNATURE, '4/4');
  timeSignatureSelect.value = savedTimeSignature;
  metronomeTimeSignature = parseTimeSignature(savedTimeSignature);
  
  // Load scale
  const savedScale = loadFromStorage(STORAGE_KEYS.SCALE, currentScale);
  currentScale = savedScale;
  scaleRootSelect.value = savedScale.root;
  scaleTypeSelect.value = savedScale.type;
  highlightScale();
  
  // Load modal visibility states (all hidden by default)
  const sheetVisible = loadFromStorage(STORAGE_KEYS.SHEET_VISIBLE, false);
  const metronomeVisible = loadFromStorage(STORAGE_KEYS.METRONOME_VISIBLE, false);
  const adsrVisible = loadFromStorage(STORAGE_KEYS.ADSR_VISIBLE, false);
  const scaleVisible = loadFromStorage(STORAGE_KEYS.SCALE_VISIBLE, false);
  
  if (!sheetVisible) {
    sheetModal.classList.add('hidden');
    sheetModalToggle.classList.remove('active');
  } else {
    sheetModal.classList.remove('hidden');
    sheetModalToggle.classList.add('active');
  }
  
  if (!metronomeVisible) {
    metronomeModal.classList.add('hidden');
    metronomeModalToggle.classList.remove('active');
  } else {
    metronomeModal.classList.remove('hidden');
    metronomeModalToggle.classList.add('active');
  }
  
  if (!adsrVisible) {
    adsrModal.classList.add('hidden');
    adsrModalToggle.classList.remove('active');
  } else {
    adsrModal.classList.remove('hidden');
    adsrModalToggle.classList.add('active');
  }
  
  if (!scaleVisible) {
    scaleModal.classList.add('hidden');
    scaleModalToggle.classList.remove('active');
  } else {
    scaleModal.classList.remove('hidden');
    scaleModalToggle.classList.add('active');
  }
}

function updateSynthADSR() {
  if (synth.get && synth.set) {
    try {
      synth.set({
        envelope: adsrEnvelope
      });
    } catch (e) {
      console.error('Error updating ADSR:', e);
    }
  }
}

// Sound selector
soundSelector.addEventListener('change', (e) => {
  const selectedSound = e.target.value;
  const currentVolume = synth.volume.value;
  
  // Batch release all active notes
  const notesToRelease = Array.from(activeNotes);
  notesToRelease.forEach(note => {
    try {
      synth.triggerRelease(note);
    } catch (error) {
      console.error('Error releasing note:', error);
    }
    stopParticleStream(note);
    const keyElement = keyElementsMap.get(note);
    if (keyElement) keyElement.classList.remove('active');
  });
  activeNotes.clear();
  heldNotes.clear();
  
  // Dispose of the old synth
  synth.dispose();
  
  // Create new synth based on selection
  switch (selectedSound) {
    case 'AMSynth':
      synth = new Tone.PolySynth(Tone.AMSynth).toDestination();
      break;
    case 'FMSynth':
      synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
      break;
    case 'DuoSynth':
      synth = new Tone.PolySynth(Tone.DuoSynth).toDestination();
      break;
    case 'MonoSynth':
      synth = new Tone.PolySynth(Tone.MonoSynth).toDestination();
      break;
    case 'MembraneSynth':
      synth = new Tone.PolySynth(Tone.MembraneSynth).toDestination();
      break;
    case 'MetalSynth':
      synth = new Tone.PolySynth(Tone.MetalSynth).toDestination();
      break;
    default:
      synth = new Tone.PolySynth(Tone.Synth, {
        envelope: adsrEnvelope
      }).toDestination();
  }
  
  // Restore volume and ADSR
  setTimeout(() => {
    synth.volume.value = currentVolume;
    updateSynthADSR();
  }, 10);
  
  // Save to localStorage
  saveToStorage(STORAGE_KEYS.SOUND, selectedSound);
});

// Volume control
volumeSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  synth.volume.value = value;
  volumeValue.textContent = `${value} dB`;
});

// Debounced save for volume
const saveVolumeDebounced = debounce((value) => {
  saveToStorage(STORAGE_KEYS.VOLUME, value);
}, 300);

volumeSlider.addEventListener('input', (e) => {
  saveVolumeDebounced(parseFloat(e.target.value));
});

// Transpose control
transposeSlider.addEventListener('input', (e) => {
  // Release all active notes before changing transpose to prevent stuck notes
  const currentActiveNotes = Array.from(activeNotes);
  const oldTranspose = transposeValue_state;
  
  currentActiveNotes.forEach(note => {
    const oldTransposedNote = transposeNote(note, oldTranspose);
    try {
      synth.triggerRelease(oldTransposedNote);
    } catch (error) {
      console.error(`Error releasing note during transpose change:`, error);
    }
    stopParticleStream(note);
    
    // Remove highlight from old transposed key
    const oldKeyElement = keyElementsMap.get(oldTransposedNote);
    if (oldKeyElement) {
      oldKeyElement.classList.remove('active');
    }
  });
  
  transposeValue_state = parseInt(e.target.value);
  transposeValue.textContent = transposeValue_state > 0 ? `+${transposeValue_state}` : transposeValue_state;
  
  // Re-trigger any notes that are still held down with new transpose value
  currentActiveNotes.forEach(note => {
    if (heldNotes.has(note)) {
      const newTransposedNote = transposeNote(note, transposeValue_state);
      try {
        synth.triggerAttack(newTransposedNote);
        const newKeyElement = keyElementsMap.get(newTransposedNote);
        if (newKeyElement) {
          newKeyElement.classList.add('active');
        }
        startParticleStream(note);
      } catch (error) {
        console.error(`Error re-triggering note after transpose:`, error);
      }
    }
  });
  
  saveToStorage(STORAGE_KEYS.TRANSPOSE, transposeValue_state);
});

// Feature toggle functionality
sheetModalToggle.addEventListener('click', () => {
  const isHidden = sheetModal.classList.toggle('hidden');
  sheetModalToggle.classList.toggle('active');
  saveToStorage(STORAGE_KEYS.SHEET_VISIBLE, !isHidden);
});

metronomeModalToggle.addEventListener('click', () => {
  const isHidden = metronomeModal.classList.toggle('hidden');
  metronomeModalToggle.classList.toggle('active');
  saveToStorage(STORAGE_KEYS.METRONOME_VISIBLE, !isHidden);
});

adsrModalToggle.addEventListener('click', () => {
  const isHidden = adsrModal.classList.toggle('hidden');
  adsrModalToggle.classList.toggle('active');
  saveToStorage(STORAGE_KEYS.ADSR_VISIBLE, !isHidden);
});

scaleModalToggle.addEventListener('click', () => {
  const isHidden = scaleModal.classList.toggle('hidden');
  scaleModalToggle.classList.toggle('active');
  saveToStorage(STORAGE_KEYS.SCALE_VISIBLE, !isHidden);
});

// Metronome functions
function parseTimeSignature(sig) {
  const [beats, division] = sig.split('/').map(Number);
  return { beats, division };
}

function updateBeatIndicator() {
  // Update beat dots visibility based on time signature
  beatDots.forEach((dot, index) => {
    if (index < metronomeTimeSignature.beats) {
      dot.style.display = 'block';
    } else {
      dot.style.display = 'none';
    }
  });
}

function playMetronomeClick() {
  if (!metronomeActive) return;
  
  // First beat gets accent (higher pitch)
  if (currentBeat === 0) {
    try {
      metronomeClickHigh.triggerAttackRelease('G5', '8n');
    } catch (error) {
      console.error('Error playing metronome high click:', error);
    }
    beatDots[currentBeat]?.classList.add('active', 'accent');
  } else {
    try {
      metronomeClickLow.triggerAttackRelease('C5', '8n');
    } catch (error) {
      console.error('Error playing metronome low click:', error);
    }
    beatDots[currentBeat]?.classList.add('active');
  }
  
  // Remove active class after a short delay
  setTimeout(() => {
    beatDots.forEach(dot => dot.classList.remove('active', 'accent'));
  }, 100);
  
  // Move to next beat
  currentBeat = (currentBeat + 1) % metronomeTimeSignature.beats;
}

function startMetronome() {
  if (metronomeActive) return;
  
  metronomeActive = true;
  currentBeat = 0;
  metronomeToggle.classList.add('active');
  metronomeToggle.querySelector('span').textContent = 'Stop';
  
  // Use Tone.Transport for accurate timing
  Tone.Transport.bpm.value = metronomeBPM;
  
  // Schedule metronome clicks
  Tone.Transport.scheduleRepeat((time) => {
    if (!metronomeActive) return;
    
    // Schedule the visual and audio updates
    Tone.Draw.schedule(() => {
      playMetronomeClick();
    }, time);
  }, '4n'); // Quarter note intervals
  
  // Start transport
  Tone.Transport.start();
  
  // Play first beat immediately
  playMetronomeClick();
}

function stopMetronome() {
  metronomeActive = false;
  metronomeToggle.classList.remove('active');
  metronomeToggle.querySelector('span').textContent = 'Start';
  
  // Stop and clear transport
  Tone.Transport.stop();
  Tone.Transport.cancel();
  
  // Clear all beat indicators
  beatDots.forEach(dot => dot.classList.remove('active', 'accent'));
  currentBeat = 0;
}

function updateMetronomeTempo() {
  if (metronomeActive) {
    // Update BPM on transport
    Tone.Transport.bpm.value = metronomeBPM;
  }
}

// Metronome event listeners
metronomeToggle.addEventListener('click', () => {
  if (metronomeActive) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

const saveBPMDebounced = debounce((bpm) => {
  saveToStorage(STORAGE_KEYS.BPM, bpm);
}, 300);

bpmSlider.addEventListener('input', (e) => {
  metronomeBPM = parseInt(e.target.value);
  bpmValue.textContent = `${metronomeBPM} BPM`;
  updateMetronomeTempo();
  saveBPMDebounced(metronomeBPM);
});

const saveMetronomeVolumeDebounced = debounce((volume) => {
  saveToStorage(STORAGE_KEYS.METRONOME_VOLUME, volume);
}, 300);

metronomeVolumeSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  metronomeClickHigh.volume.value = value;
  metronomeClickLow.volume.value = value;
  metronomeVolumeValue.textContent = `${value} dB`;
  saveMetronomeVolumeDebounced(value);
});

timeSignatureSelect.addEventListener('change', (e) => {
  metronomeTimeSignature = parseTimeSignature(e.target.value);
  updateBeatIndicator();
  currentBeat = 0;
  if (metronomeActive) {
    // Clear all indicators and restart cycle
    beatDots.forEach(dot => dot.classList.remove('active', 'accent'));
  }
  saveToStorage(STORAGE_KEYS.TIME_SIGNATURE, e.target.value);
});

// ADSR event listeners
const saveADSRDebounced = debounce((envelope) => {
  saveToStorage(STORAGE_KEYS.ADSR, envelope);
}, 300);

const saveSustainDurationDebounced = debounce((duration) => {
  saveToStorage(STORAGE_KEYS.SUSTAIN_DURATION, duration);
}, 300);

attackSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  adsrEnvelope.attack = value;
  attackValue.textContent = `${value.toFixed(3)}s`;
  updateSynthADSR();
  saveADSRDebounced(adsrEnvelope);
});

decaySlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  adsrEnvelope.decay = value;
  decayValue.textContent = `${value.toFixed(2)}s`;
  updateSynthADSR();
  saveADSRDebounced(adsrEnvelope);
});

sustainSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  adsrEnvelope.sustain = value;
  sustainValue.textContent = value.toFixed(2);
  updateSynthADSR();
  saveADSRDebounced(adsrEnvelope);
});

releaseSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  adsrEnvelope.release = value;
  releaseValue.textContent = `${value.toFixed(1)}s`;
  updateSynthADSR();
  saveADSRDebounced(adsrEnvelope);
});

sustainDurationSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  sustainDuration = value * 1000; // Convert seconds to milliseconds
  sustainDurationValue.textContent = value >= 30 ? '∞' : `${value.toFixed(1)}s`;
  saveSustainDurationDebounced(sustainDuration);
});

// ADSR reset button
adsrResetBtn.addEventListener('click', () => {
  // Reset to default values
  adsrEnvelope = { ...DEFAULT_ADSR };
  
  // Update sliders and display values
  attackSlider.value = DEFAULT_ADSR.attack;
  attackValue.textContent = `${DEFAULT_ADSR.attack.toFixed(3)}s`;
  
  decaySlider.value = DEFAULT_ADSR.decay;
  decayValue.textContent = `${DEFAULT_ADSR.decay.toFixed(2)}s`;
  
  sustainSlider.value = DEFAULT_ADSR.sustain;
  sustainValue.textContent = DEFAULT_ADSR.sustain.toFixed(2);
  
  releaseSlider.value = DEFAULT_ADSR.release;
  releaseValue.textContent = `${DEFAULT_ADSR.release.toFixed(1)}s`;
  
  sustainDuration = DEFAULT_SUSTAIN_DURATION;
  sustainDurationSlider.value = DEFAULT_SUSTAIN_DURATION / 1000;
  sustainDurationValue.textContent = (DEFAULT_SUSTAIN_DURATION / 1000) >= 30 ? '∞' : `${(DEFAULT_SUSTAIN_DURATION / 1000).toFixed(1)}s`;
  
  // Apply to synth and save
  updateSynthADSR();
  saveToStorage(STORAGE_KEYS.ADSR, adsrEnvelope);
  saveToStorage(STORAGE_KEYS.SUSTAIN_DURATION, sustainDuration);
});

// Scale highlighting functions
function getNoteWithoutOctave(note) {
  return note.replace(/[0-9]/g, '');
}

function noteToSemitoneValue(note) {
  const noteName = getNoteWithoutOctave(note);
  return noteToSemitone[noteName] !== undefined ? noteToSemitone[noteName] : -1;
}

function isNoteInScale(note, root, scaleType) {
  if (scaleType === 'none') return false;
  
  const pattern = scalePatterns[scaleType] || [];
  if (pattern.length === 0) return false;
  
  const noteSemitone = noteToSemitoneValue(note);
  const rootSemitone = noteToSemitone[root];
  
  if (noteSemitone === -1 || rootSemitone === undefined) return false;
  
  // Calculate the interval from the root
  let interval = (noteSemitone - rootSemitone + 12) % 12;
  
  return pattern.includes(interval);
}

function highlightScale() {
  keyElementsMap.forEach((keyElement, note) => {
    if (isNoteInScale(note, currentScale.root, currentScale.type)) {
      keyElement.classList.add('highlighted');
    } else {
      keyElement.classList.remove('highlighted');
    }
  });
}

// Scale event listeners
scaleRootSelect.addEventListener('change', (e) => {
  currentScale.root = e.target.value;
  highlightScale();
  saveToStorage(STORAGE_KEYS.SCALE, currentScale);
});

scaleTypeSelect.addEventListener('change', (e) => {
  currentScale.type = e.target.value;
  highlightScale();
  saveToStorage(STORAGE_KEYS.SCALE, currentScale);
});

// Sheet music visualization
const notePositions = {
  // Treble clef positions (C4 and above)
  'C': { treble: 5, bass: -2 },  // C can be on either staff
  'C#': { treble: 5, bass: -2 },
  'Db': { treble: 4.5, bass: -2.5 },
  'D': { treble: 4.5, bass: -2.5 },
  'D#': { treble: 4.5, bass: -2.5 },
  'Eb': { treble: 4, bass: -3 },
  'E': { treble: 4, bass: -3 },
  'F': { treble: 3.5, bass: -3.5 },
  'F#': { treble: 3.5, bass: -3.5 },
  'Gb': { treble: 3, bass: -4 },
  'G': { treble: 3, bass: -4 },
  'G#': { treble: 3, bass: -4 },
  'Ab': { treble: 2.5, bass: -4.5 },
  'A': { treble: 2.5, bass: -4.5 },
  'A#': { treble: 2.5, bass: -4.5 },
  'Bb': { treble: 2, bass: -5 },
  'B': { treble: 2, bass: -5 },
};

const activeSheetNotes = new Map();

function clearSheetMusic() {
  if (!notesContainer) return;
  notesContainer.innerHTML = '';
  activeSheetNotes.clear();
}

function getNoteStaffPosition(note) {
  const noteName = getNoteWithoutOctave(note);
  const octave = parseInt(note.match(/\d+/)[0]);
  const basePos = notePositions[noteName] || notePositions['C'];
  
  // Determine which staff to use based on octave
  // C4 (Middle C) and above use treble clef
  // Below C4 use bass clef
  const useTreble = octave >= 4;
  const staffBase = useTreble ? 40 : 180; // Y position of top line of each staff
  
  if (useTreble) {
    // Treble clef: each octave shifts by 3.5 lines (C4 is middle C)
    const octaveOffset = (octave - 4) * 3.5;
    const position = basePos.treble - octaveOffset;
    
    return {
      y: staffBase + (position * 20),
      needsLedger: position < 0 || position > 5,
      staff: 'treble'
    };
  } else {
    // Bass clef: D3 is the 4th line (index 3), middle line
    // Each note is a half-step on the staff
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = noteOrder.indexOf(noteName);
    
    // D3 is at position 3 (4th line from top), octave 3
    // Calculate position relative to D3
    const d3Position = 3;
    const d3Octave = 3;
    
    // Each octave is 3.5 positions (7 notes / 2)
    const octaveDiff = octave - d3Octave;
    const noteDiff = noteIndex - 1; // Relative to D (index 1)
    
    const position = d3Position - (octaveDiff * 3.5 + noteDiff * 0.5);
    
    return {
      y: staffBase + (position * 20),
      needsLedger: position < 0 || position > 5,
      staff: 'bass'
    };
  }
}

function addNoteToStaff(note) {
  if (!notesContainer) return;
  
  const pos = getNoteStaffPosition(note);
  const xPosition = 120 + (activeSheetNotes.size * 50);
  
  // Limit to show only last 12 notes
  if (activeSheetNotes.size >= 12) {
    const firstNote = activeSheetNotes.keys().next().value;
    const firstElement = activeSheetNotes.get(firstNote);
    if (firstElement && firstElement.parentNode) {
      firstElement.parentNode.removeChild(firstElement);
    }
    activeSheetNotes.delete(firstNote);
    
    // Shift all remaining notes left
    activeSheetNotes.forEach((elem) => {
      const currentX = parseFloat(elem.getAttribute('data-x'));
      const newX = currentX - 50;
      elem.setAttribute('data-x', newX);
      
      // Update all child elements
      const noteHead = elem.querySelector('ellipse');
      if (noteHead) {
        noteHead.setAttribute('cx', newX);
        const cy = noteHead.getAttribute('cy');
        noteHead.setAttribute('transform', `rotate(-20 ${newX} ${cy})`);
      }
      
      const stem = elem.querySelector('line[stroke="#667eea"]');
      if (stem) {
        stem.setAttribute('x1', newX + 7);
        stem.setAttribute('x2', newX + 7);
      }
      
      const ledger = elem.querySelector('line[stroke="#333"]');
      if (ledger) {
        ledger.setAttribute('x1', newX - 15);
        ledger.setAttribute('x2', newX + 15);
      }
    });
  }
  
  const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  noteGroup.classList.add('note-element', 'active');
  noteGroup.setAttribute('data-x', xPosition);
  
  // Add ledger lines if needed
  if (pos.needsLedger) {
    const ledgerY = Math.round(pos.y / 20) * 20;
    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ledger.setAttribute('x1', xPosition - 15);
    ledger.setAttribute('y1', ledgerY);
    ledger.setAttribute('x2', xPosition + 15);
    ledger.setAttribute('y2', ledgerY);
    ledger.setAttribute('stroke', '#333');
    ledger.setAttribute('stroke-width', '1.5');
    noteGroup.appendChild(ledger);
  }
  
  // Add sharp or flat symbol if needed
  const noteName = getNoteWithoutOctave(note);
  if (noteName.includes('#')) {
    const sharp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sharp.setAttribute('x', xPosition - 20);
    sharp.setAttribute('y', pos.y + 5);
    sharp.setAttribute('font-size', '20');
    sharp.setAttribute('font-weight', 'bold');
    sharp.setAttribute('fill', '#667eea');
    sharp.textContent = '♯';
    noteGroup.appendChild(sharp);
  } else if (noteName.includes('b') && noteName !== 'B') {
    const flat = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    flat.setAttribute('x', xPosition - 20);
    flat.setAttribute('y', pos.y + 5);
    flat.setAttribute('font-size', '20');
    flat.setAttribute('font-weight', 'bold');
    flat.setAttribute('fill', '#667eea');
    flat.textContent = '♭';
    noteGroup.appendChild(flat);
  }
  
  // Note head (filled ellipse for quarter note)
  const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  noteHead.setAttribute('cx', xPosition);
  noteHead.setAttribute('cy', pos.y);
  noteHead.setAttribute('rx', '8');
  noteHead.setAttribute('ry', '6');
  noteHead.setAttribute('fill', '#667eea');
  noteHead.setAttribute('transform', `rotate(-20 ${xPosition} ${pos.y})`);
  noteGroup.appendChild(noteHead);
  
  // Note stem
  const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  stem.setAttribute('x1', xPosition + 7);
  stem.setAttribute('y1', pos.y);
  stem.setAttribute('x2', xPosition + 7);
  stem.setAttribute('y2', pos.y - 35);
  stem.setAttribute('stroke', '#667eea');
  stem.setAttribute('stroke-width', '2');
  noteGroup.appendChild(stem);
  
  notesContainer.appendChild(noteGroup);
  activeSheetNotes.set(note + '_' + Date.now(), noteGroup);
  
  // Fade out after 3 seconds
  setTimeout(() => {
    noteGroup.classList.remove('active');
    noteGroup.classList.add('inactive');
  }, 3000);
}

// Clear sheet button
if (clearSheetBtn) {
  clearSheetBtn.addEventListener('click', clearSheetMusic);
}

// Initialize beat indicator
updateBeatIndicator();

const activeNotes = new Set();
const heldNotes = new Set();
const particleIntervals = new Map();
const sustainedNotes = new Map();
let isSustainOn = false;
// Sustain duration state
let sustainDuration = 1000; // milliseconds

// Handle audio context autoplay policy
document.addEventListener('click', async () => {
  if (Tone.context.state !== 'running') {
    await Tone.context.resume();
  }
}, { once: true, passive: true });

const scales = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Transpose a note by semitones
function transposeNote(note, semitones) {
  if (semitones === 0) return note;
  
  const noteName = getNoteWithoutOctave(note);
  let octave = parseInt(note.match(/\d+/)[0]);
  
  // Find current position in chromatic scale
  let noteIndex = chromaticScale.indexOf(noteName);
  if (noteIndex === -1) return note;
  
  // Apply transpose
  noteIndex += semitones;
  
  // Handle octave changes
  while (noteIndex < 0) {
    noteIndex += 12;
    octave--;
  }
  while (noteIndex >= 12) {
    noteIndex -= 12;
    octave++;
  }
  
  return chromaticScale[noteIndex] + octave;
}

const keyMap = {
  'KeyZ': 'C2', 'KeyX': 'D2', 'KeyC': 'E2', 'KeyV': 'F2', 'KeyB': 'G2', 'KeyN': 'A2', 'KeyM': 'B2',
  'Comma': 'C3', 'Period': 'D3', 'Slash': 'E3', 'ShiftRight': 'F3',
  'KeyA': 'C3', 'KeyS': 'D3', 'KeyD': 'E3', 'KeyF': 'F3', 'KeyG': 'G3', 'KeyH': 'A3', 'KeyJ': 'B3',
  'KeyK': 'C4', 'KeyL': 'D4', 'Semicolon': 'E4', 'Quote': 'F4', 'Enter': 'G4',
  'KeyQ': 'C4', 'KeyW': 'D4', 'KeyE': 'E4', 'KeyR': 'F4', 'KeyT': 'G4', 'KeyY': 'A4', 'KeyU': 'B4',
  'KeyI': 'C5', 'KeyO': 'D5', 'KeyP': 'E5', 'BracketLeft': 'F5', 'BracketRight': 'G5', 'Backslash': 'A5',
  'Digit1': 'C5', 'Digit2': 'D5', 'Digit3': 'E5', 'Digit4': 'F5', 'Digit5': 'G5', 'Digit6': 'A5', 'Digit7': 'B5',
  'Digit8': 'C6', 'Digit9': 'D6', 'Digit0': 'E6', 'Minus': 'F6', 'Equal': 'G6', 'Backspace': 'A6'
};

function getLabelFromCode(code) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  switch (code) {
    case 'Comma': return ',';
    case 'Period': return '.';
    case 'Slash': return '/';
    case 'Semicolon': return ';';
    case 'Quote': return "'";
    case 'BracketLeft': return '[';
    case 'BracketRight': return ']';
    case 'Backslash': return '\\';
    case 'Minus': return '-';
    case 'Equal': return '=';
    case 'Enter': return 'Enter';
    case 'ShiftRight': return 'RShift';
    case 'Backspace': return '⌫';
    default: return code;
  }
}

// Reverse map for labels
const noteToKeys = {};
for (const [code, note] of Object.entries(keyMap)) {
  if (!noteToKeys[note]) noteToKeys[note] = [];
  const label = getLabelFromCode(code);
  noteToKeys[note].push(label);
}

// Unique sorted notes - generate all chromatic notes from C2 to A6
function getAllChromaticNotes() {
  const notes = [];
  for (let octave = 2; octave <= 6; octave++) {
    chromaticScale.forEach(note => {
      const fullNote = note + octave;
      // Stop at A6
      if (octave === 6 && chromaticScale.indexOf(note) > chromaticScale.indexOf('A')) return;
      notes.push(fullNote);
    });
  }
  return notes;
}

const allNotes = getAllChromaticNotes();

// Generate visual keys with fragment for better performance
const fragment = document.createDocumentFragment();
let whiteKeyIndex = 0;

allNotes.forEach(note => {
  const keyDiv = document.createElement('div');
  const isBlackKey = note.includes('#');
  
  keyDiv.classList.add('key');
  if (isBlackKey) {
    keyDiv.classList.add('black-key');
    // Position black key between white keys
    const whiteKeyWidth = 42 + 3; // width + gap
    const offset = whiteKeyIndex * whiteKeyWidth - 14; // Center between white keys
    keyDiv.style.left = `${12 + offset}px`; // Add piano padding
  } else {
    whiteKeyIndex++;
  }
  
  keyDiv.dataset.note = note;
  
  // Only show keyboard labels on white keys that are mapped
  if (!isBlackKey && noteToKeys[note]) {
    keyDiv.innerHTML = `${note}<br>${noteToKeys[note].sort().join(', ')}`;
  } else if (!isBlackKey) {
    keyDiv.innerHTML = note;
  } else {
    keyDiv.innerHTML = `<div style="margin-top: 70px;">${note}</div>`;
  }
  
  fragment.appendChild(keyDiv);
});

piano.appendChild(fragment);

// Cache all key elements for faster access
const keyElementsMap = new Map();
document.querySelectorAll('.key').forEach(key => {
  keyElementsMap.set(key.dataset.note, key);
});

// Load all settings from localStorage (after keys are created)
loadSettings();

function getOrCreateParticle() {
  if (particlePool.length > 0) {
    return particlePool.pop();
  }
  const particle = document.createElement('div');
  particle.classList.add('particle');
  return particle;
}

function recycleParticle(particle) {
  // Clear any pending timeout
  if (particle.dataset.timeoutId) {
    clearTimeout(parseInt(particle.dataset.timeoutId));
    delete particle.dataset.timeoutId;
  }
  
  if (particlePool.length < MAX_POOL_SIZE) {
    particle.style.cssText = '';
    particlePool.push(particle);
  }
}

function createParticles(keyElement, particleCount = 3) {
  if (!keyElement) return;
  const rect = keyElement.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  for (let i = 0; i < particleCount; i++) {
    try {
      const particle = getOrCreateParticle();
      const xOffset = Math.random() * rect.width - rect.width / 2;
      particle.style.left = `${rect.left + scrollX + rect.width / 2 + xOffset}px`;
      particle.style.top = `${rect.top + scrollY + rect.height}px`;
      particle.style.animationDelay = `${Math.random() * 0.3}s`;
      document.body.appendChild(particle);
      activeParticles.add(particle);
      
      const timeoutId = setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
        activeParticles.delete(particle);
        recycleParticle(particle);
      }, 2000);
      
      // Store timeout ID on particle for cleanup
      particle.dataset.timeoutId = timeoutId;
    } catch (error) {
      console.error('Error creating particle:', error);
    }
  }
}

function startParticleStream(note) {
  const keyElement = keyElementsMap.get(note);
  if (keyElement && !particleIntervals.has(note)) {
    const interval = setInterval(() => createParticles(keyElement, 3), 300);
    particleIntervals.set(note, interval);
  }
}

function stopParticleStream(note) {
  if (particleIntervals.has(note)) {
    clearInterval(particleIntervals.get(note));
    particleIntervals.delete(note);
  }
}

function attackNote(note) {
  try {
    // Apply transpose
    const transposedNote = transposeNote(note, transposeValue_state);
    
    if (activeNotes.has(note)) {
      synth.triggerRelease(transposedNote);
    }
    synth.triggerAttack(transposedNote);
    activeNotes.add(note);
    
    // Highlight the transposed key instead of original
    const keyElement = keyElementsMap.get(transposedNote);
    if (keyElement) {
      createParticles(keyElement, 8);
      keyElement.classList.add('active');
    }
    startParticleStream(note);
    if (sustainedNotes.has(note)) {
      clearTimeout(sustainedNotes.get(note));
      sustainedNotes.delete(note);
    }
    
    // Add note to sheet music display (show the transposed note being played)
    addNoteToStaff(transposedNote);
  } catch (error) {
    console.error(`Error playing note ${note}:`, error);
  }
}

function releaseNote(note) {
  // Always calculate transposed note to remove the correct highlight
  const transposedNote = transposeNote(note, transposeValue_state);
  
  if (activeNotes.has(note)) {
    try {
      synth.triggerRelease(transposedNote);
    } catch (error) {
      console.error(`Error releasing note ${note}:`, error);
    }
    activeNotes.delete(note);
    stopParticleStream(note);
  }
  
  // Always remove highlight from the transposed key
  const keyElement = keyElementsMap.get(transposedNote);
  if (keyElement) {
    keyElement.classList.remove('active');
  }
  
  if (sustainedNotes.has(note)) {
    clearTimeout(sustainedNotes.get(note));
    sustainedNotes.delete(note);
  }
}

function scheduleSustainRelease(note) {
  if (sustainedNotes.has(note)) {
    clearTimeout(sustainedNotes.get(note));
  }
  
  // If sustain duration is at maximum (30s), treat as infinite - don't set timeout
  if (sustainDuration >= 30000) {
    sustainedNotes.set(note, null); // Mark as sustained but no timeout
    return;
  }
  
  const timeout = setTimeout(() => {
    if (!heldNotes.has(note) && isSustainOn) {
      releaseNote(note);
    }
    sustainedNotes.delete(note);
  }, sustainDuration);
  sustainedNotes.set(note, timeout);
}

function releaseSustainedNotes() {
  activeNotes.forEach(note => {
    if (!heldNotes.has(note)) {
      if (sustainedNotes.has(note)) {
        const timeout = sustainedNotes.get(note);
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        sustainedNotes.delete(note);
      }
      releaseNote(note);
    }
  });
}

// Mouse events with event delegation for better performance
piano.addEventListener('mousedown', (event) => {
  const key = event.target.closest('.key');
  if (!key) return;
  event.preventDefault();
  const note = key.dataset.note;
  attackNote(note);
  heldNotes.add(note);
});

piano.addEventListener('mouseup', (event) => {
  const key = event.target.closest('.key');
  if (!key) return;
  const note = key.dataset.note;
  heldNotes.delete(note);
  if (!isSustainOn) {
    releaseNote(note);
  } else {
    scheduleSustainRelease(note);
  }
});

piano.addEventListener('mouseleave', (event) => {
  const key = event.target.closest('.key');
  if (!key || !key.classList.contains('active')) return;
  const note = key.dataset.note;
  heldNotes.delete(note);
  if (!isSustainOn) {
    releaseNote(note);
  } else {
    scheduleSustainRelease(note);
  }
});

piano.addEventListener('mouseenter', (event) => {
  const key = event.target.closest('.key');
  if (!key) return;
  // If mouse enters while button is pressed but key is not active
  if (event.buttons === 1 && !key.classList.contains('active')) {
    const note = key.dataset.note;
    attackNote(note);
    heldNotes.add(note);
  }
});

// Keyboard events for notes - optimized
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (!isSustainOn && !event.repeat) {
      isSustainOn = true;
    }
    return;
  }
  const note = keyMap[event.code];
  if (note && !event.repeat) {
    attackNote(note);
    heldNotes.add(note);
  }
}, { passive: false }); // Not passive because we call preventDefault

document.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    isSustainOn = false;
    releaseSustainedNotes();
    return;
  }
  const note = keyMap[event.code];
  if (note) {
    heldNotes.delete(note);
    if (!isSustainOn) {
      releaseNote(note);
    } else {
      scheduleSustainRelease(note);
    }
  }
}, { passive: true });

// Handle window blur to release all notes (prevents stuck notes) - optimized
window.addEventListener('blur', () => {
  // Release all currently held notes
  heldNotes.forEach(note => {
    releaseNote(note);
  });
  heldNotes.clear();
  
  // Turn off sustain
  if (isSustainOn) {
    isSustainOn = false;
    releaseSustainedNotes();
  }
}, { passive: true });
