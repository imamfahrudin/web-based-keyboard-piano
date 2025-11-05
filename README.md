# 🎹 Web-Based Keyboard Piano

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Docker](https://img.shields.io/badge/Docker-%232496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-%23009639.svg?style=flat&logo=nginx&logoColor=white)](https://nginx.org/)
[![Tone.js](https://img.shields.io/badge/Tone.js-Audio%20Library-blueviolet)](https://tonejs.github.io/)

A feature-rich, interactive web-based piano application built with HTML5, CSS3, JavaScript, and Tone.js. Play music directly in your browser with real-time audio synthesis, sheet music visualization, and advanced sound controls.

## ✨ Features

### 🎵 Core Features
- **Interactive Piano Keyboard** - Full piano keyboard interface with mouse and keyboard support
- **Real-time Audio Synthesis** - Powered by Tone.js for high-quality sound generation
- **Multiple Sound Engines** - Choose from 7 different synthesizer types:
  - Basic Synth
  - AM Synth
  - FM Synth
  - Duo Synth
  - Mono Synth
  - Membrane Synth
  - Metallic Synth

### 🎼 Advanced Features
- **Sheet Music Display** - Real-time notation showing treble and bass clefs
- **ADSR Envelope Control** - Customize Attack, Decay, Sustain, and Release parameters
- **Metronome** - Built-in metronome with adjustable BPM and time signatures
- **Scale Helper** - Visual guide for different musical scales
- **Transpose Control** - Shift pitch up or down by semitones (-6 to +6)
- **Volume Control** - Adjustable volume with dB display

### 🎨 User Interface
- Clean, modern design with intuitive controls
- Toggle-able feature panels for distraction-free playing
- Responsive layout that adapts to different screen sizes
- Visual feedback for active notes and controls

## 🚀 Quick Start

### Option 1: Run Locally (Simple)

1. **Clone the repository**
   ```bash
   git clone https://github.com/imamfahrudin/web-based-keyboard-piano.git
   cd web-based-keyboard-piano
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - No build process or dependencies required!

### Option 2: Run with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/imamfahrudin/web-based-keyboard-piano.git
   cd web-based-keyboard-piano
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Open your browser and navigate to `http://localhost:8080`

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## 🎮 How to Use

### Playing the Piano
- **Mouse**: Click on any piano key to play a note
- **Keyboard**: Use your computer keyboard to play (keys mapped to piano notes)

### Adjusting Settings
1. **Sound Selection**: Use the dropdown menu to choose different synthesizer types
2. **Volume**: Drag the volume slider to adjust output level (-40 to 0 dB)
3. **Transpose**: Shift the pitch up or down using the transpose slider

### Advanced Features
- **Sheet Music**: Click the "Sheet Music" toggle to see notation in real-time
- **Metronome**: Enable and configure the metronome for rhythm practice
- **ADSR**: Fine-tune the sound envelope for custom tones
- **Scale**: Display visual guides for different musical scales

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5 - Structure and layout
  - CSS3 - Styling and animations
  - JavaScript (ES6+) - Application logic and interactivity
  - [Tone.js](https://tonejs.github.io/) - Web Audio framework for synthesis

- **Deployment**:
  - Docker - Containerization
  - Nginx - Web server
  - Docker Compose - Container orchestration

## 📁 Project Structure

```
web-based-keyboard-piano/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet
├── piano.js           # JavaScript logic
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose configuration
├── nginx.conf         # Nginx server configuration
└── README.md          # This file
```

## 🐳 Docker Configuration

The application is containerized using Docker for easy deployment:

- **Base Image**: Nginx Alpine (lightweight)
- **Port**: 8080 (host) → 80 (container)
- **Network**: Bridge network for isolation
- **Restart Policy**: Unless-stopped for reliability

## 🎹 Keyboard Mapping

The piano keys are mapped to your computer keyboard for easy playing. The mapping follows a standard piano layout starting from the lower keys.

## 🌟 Browser Compatibility

This application works best on modern browsers that support:
- Web Audio API
- ES6+ JavaScript
- CSS Grid and Flexbox
- SVG rendering

**Recommended Browsers**:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes following the commit message convention (see below)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Convention

Please follow these commit message prefixes:

- `feat:` - New features or enhancements
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add recording functionality
fix: correct metronome timing issue
docs: update installation instructions
style: format piano.js code
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Mukhammad Imam Fahrudin**

- GitHub: [@imamfahrudin](https://github.com/imamfahrudin)
- Repository: [web-based-keyboard-piano](https://github.com/imamfahrudin/web-based-keyboard-piano)

## 🙏 Acknowledgments

- [Tone.js](https://tonejs.github.io/) - Amazing Web Audio framework
- [Nginx](https://nginx.org/) - High-performance web server
- The open-source community for inspiration and tools

##  Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/imamfahrudin/web-based-keyboard-piano/issues) page
2. Create a new issue if your problem hasn't been reported
3. Provide as much detail as possible about the issue

---

⭐ If you find this project useful, please consider giving it a star on GitHub!

**Made with ❤️ by Mukhammad Imam Fahrudin**
