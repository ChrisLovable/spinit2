# 3D Casino Roulette Wheel

A stunning, photorealistic 3D roulette wheel built with Three.js. Features 20 numbered slots (1-20) with classic casino red/black alternating colors, a spinning golden ball that rotates for exactly 20 seconds, and lands randomly on one of the numbers.

## Features

- **Realistic 3D Graphics**: Built with Three.js for stunning visual quality
- **20 Number Slots**: Numbers 1-20 with alternating red/black colors
- **20-Second Spin**: Precise 20-second spin animation with smooth deceleration
- **Random Landing**: Ball lands randomly on one of the 20 numbers
- **Interactive Camera**: OrbitControls for 360° viewing
- **Professional UI**: Casino-style button and result display

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (typically http://localhost:3000)

## Usage

- Click the **SPIN** button to start the roulette wheel
- The wheel and ball will spin for exactly 20 seconds
- The ball will land on a random number (1-20)
- The winning number will be displayed
- Use mouse/trackpad to rotate the camera and view the wheel from different angles

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies

- **Three.js** - 3D graphics library
- **Vite** - Build tool and development server
- **OrbitControls** - Camera controls for Three.js

## Project Structure

```
SPINIT2/
├── index.html          # Main HTML file
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # Application entry point
│   ├── RouletteWheel.js # 3D wheel class
│   └── styles.css      # Styling
└── README.md           # This file
```

