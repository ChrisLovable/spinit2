import * as THREE from 'three';

export class ThemeParkWheel {
  constructor(scene) {
    this.scene = scene;
    this.casinoMusicSource = null; // Store music source
    this.floatingNumber = null; // Store floating winning number
    this.group = new THREE.Group();
    this.wheelGroup = new THREE.Group();
    this.pointerGroup = new THREE.Group();
    
    // Initialize GPU-friendly fireworks particle system
    this.initFireworksSystem();
    
    // Constants - 75% of original size
    this.NUM_SLOTS = 20;
    this.OUTER_RADIUS = 2.5 * 0.75; // 75% of original
    this.INNER_RADIUS = 2.0 * 0.75;
    this.TRACK_RADIUS = 2.25 * 0.75; // Where ball rolls
    this.SLOT_DEPTH = 0.5 * 0.75; // More depth for 3D effect
    this.WHEEL_HEIGHT = 0.6 * 0.75; // Taller for more 3D presence
    this.BALL_RADIUS = 0.12 * 0.75; // Ball size
    
    // Animation state
    this.isSpinning = false;
    this.wheelRotation = 0;
    this.targetNumber = null;
    this.startTime = null;
    this.duration = 20000; // 20 seconds in milliseconds
    this.winningSlotIndex = -1; // Track winning slot for highlighting
    this.slotMeshes = []; // Store slot meshes for highlighting
    
    // Store the exact sequence for reference
    this.rouletteSequence = [
      { num: 14, color: 'red' },    // 14 – RED
      { num: 11, color: 'black' },  // 11 – BLACK
      { num: 3, color: 'red' },     // 3  – RED
      { num: 20, color: 'black' },  // 20 – BLACK
      { num: 7, color: 'red' },     // 7  – RED
      { num: 2, color: 'black' },   // 2  – BLACK
      { num: 18, color: 'red' },    // 18 – RED
      { num: 15, color: 'black' },  // 15 – BLACK
      { num: 1, color: 'red' },     // 1  – RED
      { num: 6, color: 'black' },   // 6  – BLACK
      { num: 9, color: 'red' },     // 9  – RED
      { num: 13, color: 'black' },  // 13 – BLACK
      { num: 16, color: 'red' },    // 16 – RED
      { num: 4, color: 'black' },   // 4  – BLACK
      { num: 5, color: 'red' },     // 5  – RED
      { num: 10, color: 'black' },  // 10 – BLACK
      { num: 19, color: 'red' },    // 19 – RED
      { num: 8, color: 'black' },    // 8  – BLACK
      { num: 12, color: 'red' },     // 12 – RED
      { num: 17, color: 'black' }    // 17 – BLACK
    ];
    
    // Physics state
    this.wheelAngularVelocity = 0;
    this.ballAngularVelocity = 0;
    this.friction = 0.990; // Moderate slowdown (higher = less friction)
    this.airResistance = 0.999; // Moderate air resistance
    this.ballFriction = 0.989; // Ball slows down separately
    
    // Sound state for clicking
    this.lastSlotIndex = -1;
    this.audioContext = null;
    this.winSoundBuffer = null;
    this.casinoMusicBuffer = null;
    this.casinoMusicSource = null;
    this.initClickSound();
    this.initWinSound();
    this.initCasinoMusic();
    
    // Initialize ball group before creating ball
    this.ballGroup = new THREE.Group();
    
    this.createWheel();
    this.createBase();
    this.createPointer();
    this.createBall();
    
    this.group.add(this.wheelGroup);
    this.group.add(this.pointerGroup);
    this.group.add(this.ballGroup);
    
    // Position will be set in main.js - don't set it here to avoid conflicts
    // Default to origin, main.js will position it correctly
    
    scene.add(this.group);
  }
  
  initFireworksSystem() {
    this.maxParticles = 12000;            // big but still OK
    this.particlesAlive = 0;
    this._fwTimer = 0; // Timer for continuous bursts during spin

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const life = new Float32Array(this.maxParticles);
    const maxLife = new Float32Array(this.maxParticles);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('life', new THREE.BufferAttribute(life, 1));
    geo.setAttribute('maxLife', new THREE.BufferAttribute(maxLife, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.fireworksPoints = new THREE.Points(geo, mat);
    this.fireworksPoints.frustumCulled = false; // always visible
    this.scene.add(this.fireworksPoints);

    this.fireworksGeo = geo;
    this.fireworksData = { positions, velocities, colors, life, maxLife };
  }
  
  createBall() {
    // Create a white ball that spins around the track
    const ballGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White ball
      metalness: 0.2,
      roughness: 0.5,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.1
    });
    
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.castShadow = true;
    this.ball.receiveShadow = true;
    
    // Initialize ball rotation
    this.ballRotation = 0;
    this.updateBallPosition();
    this.ballGroup.add(this.ball);
  }
  
  updateBallPosition() {
    // Ball position on the track
    this.ball.position.x = Math.cos(this.ballRotation) * this.TRACK_RADIUS;
    this.ball.position.z = Math.sin(this.ballRotation) * this.TRACK_RADIUS;
    this.ball.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH + this.BALL_RADIUS + 0.05;
  }
  
  // Get which slot the ball is in (determines winner)
  getBallSlot() {
    const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    
    // Ball's angle relative to wheel center
    // Normalize to [0, 2π]
    let ballAngle = this.ballRotation;
    while (ballAngle < 0) ballAngle += Math.PI * 2;
    while (ballAngle >= Math.PI * 2) ballAngle -= Math.PI * 2;
    
    // Each slot starts at: slotIndex * slotAngle - PI/2
    // Find which slot contains the ball
    // Adjust for -PI/2 offset
    let adjustedAngle = ballAngle + Math.PI / 2;
    if (adjustedAngle >= Math.PI * 2) adjustedAngle -= Math.PI * 2;
    
    let slotIndex = Math.floor(adjustedAngle / slotAngle);
    
    // Handle edge case
    if (slotIndex >= this.NUM_SLOTS) slotIndex = 0;
    if (slotIndex < 0) slotIndex = this.NUM_SLOTS - 1;
    
    return slotIndex + 1; // Convert to 1-20
  }
  
  initClickSound() {
    // Create clicking sound using Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }
  
  initWinSound() {
    // Initialize casino win sound
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Create a casino win sound (chime/bell sound)
      const sampleRate = this.audioContext.sampleRate;
      const duration = 1.5; // 1.5 seconds
      const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Create a pleasant casino win chime
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Multiple harmonics for rich casino sound
        const freq1 = 523.25; // C5
        const freq2 = 659.25; // E5
        const freq3 = 783.99; // G5
        
        const envelope = Math.exp(-t * 2); // Decay envelope
        const wave1 = Math.sin(2 * Math.PI * freq1 * t) * envelope;
        const wave2 = Math.sin(2 * Math.PI * freq2 * t) * envelope * 0.7;
        const wave3 = Math.sin(2 * Math.PI * freq3 * t) * envelope * 0.5;
        
        data[i] = (wave1 + wave2 + wave3) * 0.3;
      }
      
      this.winSoundBuffer = buffer;
    } catch (e) {
      console.warn('Could not initialize win sound:', e);
    }
  }
  
  playWinSound() {
    // Play casino win sound
    if (this.audioContext && this.winSoundBuffer) {
      try {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.winSoundBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      } catch (e) {
        console.warn('Could not play win sound:', e);
      }
    }
  }
  
  createSparkles(slot) {
    // Create sparkle particles around winning number
    const sparkleCount = 30;
    const sparkles = [];
    
    // Get slot center position
    const slotIndex = slot.userData.slotIndex;
    const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    const slotCenterAngle = (slotIndex + 0.5) * slotAngle - Math.PI / 2;
    const slotRadius = (this.OUTER_RADIUS + this.INNER_RADIUS) / 2;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const sparkleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF00, // Gold/yellow sparkles
        emissive: 0xFFFF00,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 1.0
      });
      
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      
      // Position around the slot center
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const radius = 0.3;
      sparkle.position.set(
        Math.cos(slotCenterAngle) * slotRadius + Math.cos(angle) * radius,
        this.WHEEL_HEIGHT / 2 + 0.2,
        Math.sin(slotCenterAngle) * slotRadius + Math.sin(angle) * radius
      );
      
      this.wheelGroup.add(sparkle);
      sparkles.push(sparkle);
    }
    
    // Animate sparkles
    let sparkleTime = 0;
    const sparkleInterval = setInterval(() => {
      sparkleTime += 0.05;
      
      sparkles.forEach((sparkle, i) => {
        const angle = (Math.PI * 2 * i) / sparkleCount;
        const radius = 0.3 + Math.sin(sparkleTime * 2 + i) * 0.2;
        const height = Math.sin(sparkleTime * 3 + i * 0.5) * 0.3;
        
        sparkle.position.set(
          Math.cos(slotCenterAngle) * slotRadius + Math.cos(angle) * radius,
          this.WHEEL_HEIGHT / 2 + 0.2 + height,
          Math.sin(slotCenterAngle) * slotRadius + Math.sin(angle) * radius
        );
        
        sparkle.material.opacity = Math.max(0, 1 - sparkleTime / 2);
        sparkle.material.emissiveIntensity = Math.max(0, 1 - sparkleTime / 2);
        sparkle.scale.setScalar(0.5 + Math.sin(sparkleTime * 5 + i) * 0.5);
      });
      
      if (sparkleTime > 2) {
        clearInterval(sparkleInterval);
        sparkles.forEach(sparkle => {
          this.wheelGroup.remove(sparkle);
          sparkle.geometry.dispose();
          sparkle.material.dispose();
        });
      }
    }, 50);
  }
  
  playClickSound() {
    if (!this.audioContext) {
      // Try to resume audio context (needed for user interaction)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return;
    }
    
    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Short, sharp click sound - like a prize wheel clicker
      oscillator.type = 'square'; // Square wave for sharper click
      oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.03);
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.03);
    } catch (e) {
      // Silently fail if audio can't play
    }
  }
  
  createPointer() {
    // Group at the top edge of the wheel (world space)
    this.pointerGroup = this.pointerGroup || new THREE.Group();

    const zTop = -this.OUTER_RADIUS - 0.12;
    const yTop = this.WHEEL_HEIGHT / 2 + 0.12;

    // --- Mount (bolted bracket)
    const mountGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.10, 24);
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.2,
    });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.rotation.x = Math.PI / 2;
    mount.position.set(0, yTop + 0.06, zTop);
    mount.castShadow = true;
    this.pointerGroup.add(mount);

    // --- Hinge (little pin)
    const hingeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.20, 16);
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.25,
    });
    const hinge = new THREE.Mesh(hingeGeo, hingeMat);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, yTop + 0.10, zTop);
    hinge.castShadow = true;
    this.pointerGroup.add(hinge);

    // --- Flap (springy ticker tab)
    // This is what "clicks" on dividers.
    const flapGeo = new THREE.BoxGeometry(0.12, 0.40, 0.08);
    const flapMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000,          // Red flap like real prize wheels
      metalness: 0.2,
      roughness: 0.35,
      emissive: 0x330000,
      emissiveIntensity: 0.15,
    });

    this.tickerFlap = new THREE.Mesh(flapGeo, flapMat);
    this.tickerFlap.castShadow = true;

    // Place flap so its bottom touches the rim
    this.tickerFlap.position.set(0, yTop + 0.02, zTop + 0.04);

    // Rotate flap downward so it rests on the rim
    this.tickerFlap.rotation.x = Math.PI / 10;

    // Put flap in its own pivot group (so we can rotate it like a hinge)
    this.tickerPivot = new THREE.Group();
    this.tickerPivot.position.set(0, yTop + 0.10, zTop); // hinge point
    this.tickerPivot.add(this.tickerFlap);

    this.pointerGroup.add(this.tickerPivot);

    // --- SIMPLE 3D ARROW POINTER - CLEAN AND DIRECT
    // Just a clean 3D arrow pointing down at the number
    const arrowLength = this.OUTER_RADIUS * 0.6; // Extend into the wheel
    const arrowWidth = 0.25; // Moderate width
    
    // Arrow shaft (cylinder)
    const shaftGeo = new THREE.CylinderGeometry(arrowWidth * 0.3, arrowWidth * 0.3, arrowLength, 12);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFF0000,
      emissiveIntensity: 1.5,
    });
    const arrowShaft = new THREE.Mesh(shaftGeo, shaftMat);
    arrowShaft.rotation.x = Math.PI / 2;
    arrowShaft.position.set(0, yTop - arrowLength / 2, zTop);
    
    // Arrow head (cone pointing down)
    const headGeo = new THREE.ConeGeometry(arrowWidth, arrowLength * 0.4, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFF0000,
      emissiveIntensity: 2.0,
    });
    const arrowHead = new THREE.Mesh(headGeo, headMat);
    arrowHead.rotation.x = Math.PI; // Point down
    arrowHead.position.set(0, yTop - arrowLength, zTop);
    
    // Create simple pointer group
    this.fixedPointer = new THREE.Group();
    this.fixedPointer.add(arrowShaft);
    this.fixedPointer.add(arrowHead);
    
    // Position at the top of the wheel
    this.fixedPointer.position.set(0, 0, 0);
    this.fixedPointer.castShadow = true;
    this.pointerGroup.add(this.fixedPointer);
    
    // Remove indicator ring - not needed for simple pointer
    this.indicatorRing = null;

    // --- Ticker physics state (spring)
    this.tickerAngle = 0;       // current hinge angle offset
    this.tickerVel = 0;         // angular velocity
    this.tickerRest = 0;        // resting angle offset
    this.tickerK = 140;         // spring stiffness
    this.tickerDamp = 14;       // damping
    this.tickerKick = 0.55;     // kick strength on click

    // NOTE: pointerGroup is already added to this.group in constructor
    // Do NOT add it here again to avoid duplication
  }
  
  createBase() {
    // Classic roulette rim - metallic
    const rimGeometry = new THREE.CylinderGeometry(
      this.OUTER_RADIUS + 0.15,
      this.OUTER_RADIUS + 0.15,
      this.WHEEL_HEIGHT + 0.1,
      64
    );
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, // Dark metallic
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x1a1a1a,
      emissiveIntensity: 0.05
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = -this.WHEEL_HEIGHT / 2;
    rim.castShadow = true;
    rim.receiveShadow = true;
    this.group.add(rim);
    
    // Inner rim detail - dark metallic (no gold)
    const innerRimGeometry = new THREE.CylinderGeometry(
      this.OUTER_RADIUS + 0.05,
      this.OUTER_RADIUS + 0.05,
      this.WHEEL_HEIGHT + 0.05,
      64
    );
    const innerRimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, // Dark metallic
      metalness: 0.9,
      roughness: 0.2
    });
    const innerRim = new THREE.Mesh(innerRimGeometry, innerRimMaterial);
    innerRim.position.y = -this.WHEEL_HEIGHT / 2 + 0.025;
    this.group.add(innerRim);
    
    // Classic roulette base - wood/metal
    const baseGeometry = new THREE.CylinderGeometry(
      this.OUTER_RADIUS + 0.2,
      this.OUTER_RADIUS + 0.2,
      0.15,
      64
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown wood
      roughness: 0.8,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -this.WHEEL_HEIGHT / 2 - 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);
  }
  
  createWheel() {
    // 🔥 HARD RESET wheel meshes (prevents old sequence staying visible)
    while (this.wheelGroup.children.length > 0) {
      const child = this.wheelGroup.children.pop();
      if (child.geometry) child.geometry.dispose?.();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
        else child.material.dispose?.();
      }
    }

    this.slotMeshes = [];
    this.numberToSlotIndex = {};
    
    const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    
    // Use the exact sequence stored in the class - THIS IS THE ONLY SOURCE OF TRUTH
    // DO NOT USE LOCAL VARIABLE - USE this.rouletteSequence DIRECTLY
    const rouletteSequence = this.rouletteSequence;
    
    // Debug: Log the FULL sequence to verify - ALL 20 NUMBERS
    console.log('=== ROULETTE SEQUENCE VERIFICATION ===');
    console.log('Full Sequence:', JSON.stringify(rouletteSequence, null, 2));
    console.log('Sequence String:', rouletteSequence.map(s => `${s.num}(${s.color})`).join(' → '));
    
    // Verify first 5 slots match expected
    const expectedFirst5 = [
      { num: 14, color: 'red' },
      { num: 11, color: 'black' },
      { num: 3, color: 'red' },
      { num: 20, color: 'black' },
      { num: 7, color: 'red' }
    ];
    console.log('Expected first 5:', expectedFirst5.map(s => `${s.num}(${s.color})`).join(' → '));
    console.log('Actual first 5:', rouletteSequence.slice(0, 5).map(s => `${s.num}(${s.color})`).join(' → '));
    console.log('Match:', JSON.stringify(rouletteSequence.slice(0, 5)) === JSON.stringify(expectedFirst5));
    console.log('=======================================');
    
    // Create slots as pie slices
    for (let i = 0; i < this.NUM_SLOTS; i++) {
      // USE this.rouletteSequence DIRECTLY - NO LOCAL VARIABLE
      const slotData = this.rouletteSequence[i];
      
      if (!slotData) {
        throw new Error(`rouletteSequence missing entry at index ${i}`);
      }
      
      const number = slotData.num;
      const isRed = slotData.color === 'red';
      const startAngle = i * slotAngle - Math.PI / 2; // Start at top
      const endAngle = (i + 1) * slotAngle - Math.PI / 2;
      
      // Use the color from the sequence DIRECTLY - no lookup, no override
      const slotColor = isRed ? 0xDC143C : 0x000000; // Red or Black
      
      // Debug: Log each slot to verify
      if (i < 10) {
        console.log(`Slot ${i}: Number ${number}, Color: ${slotData.color}, Hex: ${slotColor.toString(16)}`);
      }
      
      // Create slot geometry as a pie slice using custom shape
      const shape = new THREE.Shape();
      
      // Start at center
      shape.moveTo(0, 0);
      
      // Line to outer radius at start angle
      shape.lineTo(
        Math.cos(startAngle) * this.OUTER_RADIUS,
        Math.sin(startAngle) * this.OUTER_RADIUS
      );
      
      // Arc along outer edge
      shape.absarc(0, 0, this.OUTER_RADIUS, startAngle, endAngle, false);
      
      // Line to inner radius at end angle
      shape.lineTo(
        Math.cos(endAngle) * this.INNER_RADIUS,
        Math.sin(endAngle) * this.INNER_RADIUS
      );
      
      // Arc along inner edge (reverse direction)
      shape.absarc(0, 0, this.INNER_RADIUS, endAngle, startAngle, true);
      
      // Close the shape
      shape.lineTo(0, 0);
      
      // Extrude to create 3D slot
      const extrudeSettings = {
        depth: this.SLOT_DEPTH,
        bevelEnabled: false
      };
      const slotGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      slotGeometry.rotateX(-Math.PI / 2);
      slotGeometry.translate(0, this.SLOT_DEPTH / 2, 0);
      
      // Main slot with enhanced 3D material - roulette style
      const slotMaterial = new THREE.MeshStandardMaterial({
        color: slotColor,
        roughness: 0.5,
        metalness: 0.3,
        emissive: slotColor === 0xDC143C ? 0xDC143C : 0x000000,
        emissiveIntensity: slotColor === 0xDC143C ? 0.2 : 0.05
      });
      
      const slot = new THREE.Mesh(slotGeometry, slotMaterial);
      slot.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH / 2;
      slot.castShadow = true;
      slot.receiveShadow = true;
      slot.userData = { number: number, slotIndex: i, actualNumber: number }; // Store number for highlighting
      this.wheelGroup.add(slot);
      this.slotMeshes.push(slot); // Store for highlighting
      
      // Store number mapping for lookup
      if (!this.numberToSlotIndex) this.numberToSlotIndex = {};
      this.numberToSlotIndex[number] = i;
      
      // Add raised edge on top of slot for 3D prize wheel effect
      const edgeShape = new THREE.Shape();
      edgeShape.moveTo(0, 0);
      edgeShape.lineTo(
        Math.cos(startAngle) * this.OUTER_RADIUS,
        Math.sin(startAngle) * this.OUTER_RADIUS
      );
      edgeShape.absarc(0, 0, this.OUTER_RADIUS, startAngle, endAngle, false);
      edgeShape.lineTo(
        Math.cos(endAngle) * (this.OUTER_RADIUS - 0.05),
        Math.sin(endAngle) * (this.OUTER_RADIUS - 0.05)
      );
      edgeShape.absarc(0, 0, this.OUTER_RADIUS - 0.05, endAngle, startAngle, true);
      edgeShape.lineTo(0, 0);
      
      const edgeGeometry = new THREE.ExtrudeGeometry(edgeShape, {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02
      });
      edgeGeometry.rotateX(-Math.PI / 2);
      edgeGeometry.translate(0, this.SLOT_DEPTH / 2, 0);
      
      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.1
      });
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH;
      edge.castShadow = true;
      this.wheelGroup.add(edge);
      
      // Add slot bottom for depth
      const slotBottomShape = new THREE.Shape();
      slotBottomShape.moveTo(0, 0);
      slotBottomShape.lineTo(
        Math.cos(startAngle) * this.OUTER_RADIUS,
        Math.sin(startAngle) * this.OUTER_RADIUS
      );
      slotBottomShape.absarc(0, 0, this.OUTER_RADIUS, startAngle, endAngle, false);
      slotBottomShape.lineTo(
        Math.cos(endAngle) * this.INNER_RADIUS,
        Math.sin(endAngle) * this.INNER_RADIUS
      );
      slotBottomShape.absarc(0, 0, this.INNER_RADIUS, endAngle, startAngle, true);
      slotBottomShape.lineTo(0, 0);
      
      const slotBottomGeometry = new THREE.ShapeGeometry(slotBottomShape);
      slotBottomGeometry.rotateX(-Math.PI / 2);
      const slotBottom = new THREE.Mesh(
        slotBottomGeometry,
        new THREE.MeshStandardMaterial({
          color: slotColor,
          roughness: 0.7,
          metalness: 0.1
        })
      );
      slotBottom.position.y = -this.WHEEL_HEIGHT / 2;
      this.wheelGroup.add(slotBottom);
      
      // Add number label
      const labelAngle = (startAngle + endAngle) / 2;
      this.addNumberLabel(number, labelAngle, slotColor);
      
      // Add divider between slots
      this.addDivider(endAngle, this.OUTER_RADIUS);
    }
    
    // Print final order for verification
    console.log(
      'FINAL ORDER:',
      this.rouletteSequence.map(s => `${s.num}-${s.color}`).join(' | ')
    );
    
    // Inner track wall - slanted for realism
    // Use CylinderGeometry for truncated cone (different top/bottom radii)
    const trackWallGeometry = new THREE.CylinderGeometry(
      this.INNER_RADIUS + 0.1,  // top radius
      this.INNER_RADIUS,        // bottom radius
      this.WHEEL_HEIGHT * 0.9,  // height
      64                        // radial segments
    );
    const trackWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.25
    });
    const trackWall = new THREE.Mesh(trackWallGeometry, trackWallMaterial);
    trackWall.position.y = -this.WHEEL_HEIGHT / 2 + this.WHEEL_HEIGHT * 0.45;
    trackWall.rotation.z = Math.PI;
    trackWall.castShadow = true;
    trackWall.receiveShadow = true;
    this.wheelGroup.add(trackWall);
    
    // Track surface (where ball rolls)
    const trackSurfaceGeometry = new THREE.RingGeometry(
      this.INNER_RADIUS + 0.05,
      this.TRACK_RADIUS + 0.1,
      64
    );
    const trackSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const trackSurface = new THREE.Mesh(trackSurfaceGeometry, trackSurfaceMaterial);
    trackSurface.rotation.x = -Math.PI / 2;
    trackSurface.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH + 0.01;
    trackSurface.receiveShadow = true;
    this.wheelGroup.add(trackSurface);
    
    // Create 3D internal segments that match the color of each outer number slice
    const innerSlotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    const innerRadius = 0.3; // Inner radius for center segments
    
    for (let i = 0; i < this.NUM_SLOTS; i++) {
      // USE this.rouletteSequence DIRECTLY - NO LOCAL VARIABLE
      const slotData = this.rouletteSequence[i];
      
      if (!slotData) {
        throw new Error(`rouletteSequence missing entry at index ${i} (inner segments)`);
      }
      
      // Use the color from the sequence (already specified correctly)
      const isRed = slotData.color === 'red';
      const innerSlotColor = isRed ? 0xDC143C : 0x000000; // Match outer color
      
      const innerStartAngle = i * innerSlotAngle - Math.PI / 2;
      const innerEndAngle = (i + 1) * innerSlotAngle - Math.PI / 2;
      
      // Create inner segment shape (from innerRadius to INNER_RADIUS)
      const innerShape = new THREE.Shape();
      innerShape.moveTo(0, 0);
      innerShape.lineTo(
        Math.cos(innerStartAngle) * this.INNER_RADIUS,
        Math.sin(innerStartAngle) * this.INNER_RADIUS
      );
      innerShape.absarc(0, 0, this.INNER_RADIUS, innerStartAngle, innerEndAngle, false);
      innerShape.lineTo(
        Math.cos(innerEndAngle) * innerRadius,
        Math.sin(innerEndAngle) * innerRadius
      );
      innerShape.absarc(0, 0, innerRadius, innerEndAngle, innerStartAngle, true);
      innerShape.lineTo(0, 0);
      
      // Extrude to create 3D inner segment with beveled edges
      const innerExtrudeSettings = {
        depth: this.SLOT_DEPTH * 0.9,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 3
      };
      const innerSegmentGeometry = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
      innerSegmentGeometry.rotateX(-Math.PI / 2);
      innerSegmentGeometry.translate(0, this.SLOT_DEPTH * 0.45, 0);
      
      const innerSegmentMaterial = new THREE.MeshStandardMaterial({
        color: innerSlotColor,
        roughness: 0.3,
        metalness: 0.5,
        emissive: innerSlotColor === 0xDC143C ? 0xDC143C : 0x000000,
        emissiveIntensity: innerSlotColor === 0xDC143C ? 0.2 : 0.03
      });
      
      const innerSegment = new THREE.Mesh(innerSegmentGeometry, innerSegmentMaterial);
      innerSegment.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH * 0.45;
      innerSegment.castShadow = true;
      innerSegment.receiveShadow = true;
      this.wheelGroup.add(innerSegment);
      
      // Add raised white edge on inner segment for 3D effect (like dartboard wires)
      const innerEdgeShape = new THREE.Shape();
      innerEdgeShape.moveTo(0, 0);
      innerEdgeShape.lineTo(
        Math.cos(innerStartAngle) * this.INNER_RADIUS,
        Math.sin(innerStartAngle) * this.INNER_RADIUS
      );
      innerEdgeShape.absarc(0, 0, this.INNER_RADIUS, innerStartAngle, innerEndAngle, false);
      innerEdgeShape.lineTo(
        Math.cos(innerEndAngle) * (this.INNER_RADIUS - 0.02),
        Math.sin(innerEndAngle) * (this.INNER_RADIUS - 0.02)
      );
      innerEdgeShape.absarc(0, 0, this.INNER_RADIUS - 0.02, innerEndAngle, innerStartAngle, true);
      innerEdgeShape.lineTo(0, 0);
      
      const innerEdgeGeometry = new THREE.ExtrudeGeometry(innerEdgeShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2
      });
      innerEdgeGeometry.rotateX(-Math.PI / 2);
      innerEdgeGeometry.translate(0, this.SLOT_DEPTH * 0.45 + 0.03, 0);
      
      const innerEdgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.1
      });
      const innerEdge = new THREE.Mesh(innerEdgeGeometry, innerEdgeMaterial);
      innerEdge.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH * 0.45 + 0.03;
      innerEdge.castShadow = true;
      this.wheelGroup.add(innerEdge);
    }
    
    // Small dark center hub (minimal, no gold)
    const hubGeometry = new THREE.CylinderGeometry(
      0.15,
      0.15,
      0.08,
      32
    );
    const hubMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark
      metalness: 0.8,
      roughness: 0.3
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.y = -this.WHEEL_HEIGHT / 2 + 0.04;
    hub.castShadow = true;
    this.wheelGroup.add(hub);
  }
  
  addNumberLabel(number, angle, slotColor) {
    // Create larger, clearer canvas for text - optimized for mobile
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Draw number with maximum visibility for mobile - roulette style
    const textColor = '#FFFFFF';
    const strokeColor = slotColor === 0xDC143C ? '#000000' : '#FFFFFF'; // Black stroke on red, white on black
    
    // Strong outer glow/shadow for visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 25;
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    
    // Draw number with thick stroke for maximum visibility
    context.fillStyle = textColor;
    context.font = 'bold 220px Arial'; // Larger for mobile
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 20; // Thicker stroke
    context.strokeStyle = strokeColor;
    context.strokeText(number.toString(), 256, 256);
    context.fillText(number.toString(), 256, 256);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite - larger and more visible for mobile
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Position on wheel - higher up and larger for mobile viewing
    const labelRadius = (this.OUTER_RADIUS + this.INNER_RADIUS) / 2;
    sprite.position.x = Math.cos(angle) * labelRadius;
    sprite.position.y = -this.WHEEL_HEIGHT / 2 + this.SLOT_DEPTH + 0.35;
    sprite.position.z = Math.sin(angle) * labelRadius;
    sprite.scale.set(1.0, 1.0, 1); // Larger scale for mobile
    
    // Make sprite always face up (for top-down view)
    sprite.rotation.x = -Math.PI / 2;
    
    this.wheelGroup.add(sprite);
  }
  
  addDivider(angle, radius) {
    // 3D walls between numbers - tall enough for ticker to fall into
    const wallHeight = this.SLOT_DEPTH + 0.3; // Tall walls extending above slots
    const wallThickness = 0.08; // Thicker walls
    const wallDepth = 0.2; // Depth of wall
    
    // Main wall divider - extends from inner to outer radius
    const dividerGeometry = new THREE.BoxGeometry(
      wallThickness,
      wallHeight,
      wallDepth
    );
    const dividerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.15
    });
    const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
    
    // Position at outer edge
    divider.position.x = Math.cos(angle) * radius;
    divider.position.y = -this.WHEEL_HEIGHT / 2 + wallHeight / 2;
    divider.position.z = Math.sin(angle) * radius;
    divider.lookAt(0, divider.position.y, 0);
    divider.castShadow = true;
    divider.receiveShadow = true;
    
    this.wheelGroup.add(divider);
    
    // Inner wall section (from inner radius to outer)
    const innerWallGeometry = new THREE.BoxGeometry(
      wallThickness * 0.8,
      wallHeight * 0.9,
      wallDepth * 0.8
    );
    const innerWall = new THREE.Mesh(innerWallGeometry, dividerMaterial);
    const innerRadius = this.INNER_RADIUS;
    innerWall.position.x = Math.cos(angle) * ((radius + innerRadius) / 2);
    innerWall.position.y = -this.WHEEL_HEIGHT / 2 + wallHeight * 0.45;
    innerWall.position.z = Math.sin(angle) * ((radius + innerRadius) / 2);
    innerWall.lookAt(0, innerWall.position.y, 0);
    innerWall.castShadow = true;
    this.wheelGroup.add(innerWall);
    
    // Top edge highlight for visibility
    const highlightGeometry = new THREE.BoxGeometry(0.02, 0.08, wallDepth + 0.05);
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.98,
      roughness: 0.02,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.x = Math.cos(angle) * radius;
    highlight.position.y = -this.WHEEL_HEIGHT / 2 + wallHeight - 0.04;
    highlight.position.z = Math.sin(angle) * radius;
    highlight.lookAt(0, highlight.position.y, 0);
    this.wheelGroup.add(highlight);
  }
  
  // Calculate which number is at the top pointer
  getNumberAtPointer() {
    // Pointer is FIXED at top (angle = -PI/2 in world space)
    // The wheel has rotated, so we need to find which slot is at the pointer
    const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    
    // Pointer is at -PI/2 (top) in world space
    // When wheel rotates clockwise (positive rotation), slots move clockwise
    // To find which slot is at the pointer, we need to "undo" the rotation
    // So we ADD the rotation to find the original slot angle
    // ✅ ALWAYS use FROZEN rotation when stopped - wheelRotation is locked when frozen
    // When frozen, wheelRotation itself is already set to frozenWheelRotation, but use frozenWheelRotation directly for safety
    const rotationToUse = (this.wheelRotationFrozen && this.frozenWheelRotation !== undefined) 
      ? this.frozenWheelRotation 
      : this.wheelRotation;
    let wheelAngleAtPointer = -Math.PI / 2 + rotationToUse;
    
    // Normalize to [0, 2π]
    while (wheelAngleAtPointer < 0) wheelAngleAtPointer += Math.PI * 2;
    while (wheelAngleAtPointer >= Math.PI * 2) wheelAngleAtPointer -= Math.PI * 2;
    
    // Each slot starts at: slotIndex * slotAngle - PI/2
    // Find which slot contains this angle
    // Slot 0 (number 1) starts at -PI/2
    // Add PI/2 to convert to [0, 2π] range
    let adjustedAngle = wheelAngleAtPointer + Math.PI / 2;
    if (adjustedAngle >= Math.PI * 2) adjustedAngle -= Math.PI * 2;
    
    let slotIndex = Math.floor(adjustedAngle / slotAngle);
    
    // Handle edge case at 0/2π boundary
    if (slotIndex >= this.NUM_SLOTS) slotIndex = 0;
    if (slotIndex < 0) slotIndex = this.NUM_SLOTS - 1;
    
    // Get the actual number from the slot (using roulette sequence)
    if (this.slotMeshes[slotIndex] && this.slotMeshes[slotIndex].userData) {
      return this.slotMeshes[slotIndex].userData.actualNumber || (slotIndex + 1);
    }
    
    // Fallback
    return slotIndex + 1;
  }
  
  spin(targetNumber) {
    if (this.isSpinning) return;
    
    this.targetNumber = targetNumber;
    this.isSpinning = true;
    this.startTime = Date.now();
    this.lastSlotIndex = -1; // Reset for click detection
    this.finalWinningNumber = undefined; // Reset winning number - will be set when wheel stops
    this._fwTimer = 0; // Reset fireworks timer
    this.wheelRotationFrozen = false; // Reset frozen state for new spin
    this.frozenWheelRotation = undefined; // Clear frozen rotation
    
    // Play casino music while wheel spins
    this.playCasinoMusic();
    
    // Start fireworks immediately when spin begins
    this.createFireworks(targetNumber);
    
    // THE POINTER IS FIXED AT THE TOP - THE WHEEL SPINS AND STOPS WITH TARGET NUMBER AT POINTER
    const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
    
    // Store initial state
    this.initialWheelRotation = this.wheelRotation;
    this.initialBallRotation = this.ballRotation || 0;
    
    // Find which slot index contains the target number (using roulette sequence)
    let targetSlotIndex = -1;
    for (let i = 0; i < this.slotMeshes.length; i++) {
      if (this.slotMeshes[i].userData && this.slotMeshes[i].userData.actualNumber === targetNumber) {
        targetSlotIndex = i;
        break;
      }
    }
    
    // If not found, use targetNumber - 1 as fallback
    if (targetSlotIndex === -1) {
      targetSlotIndex = targetNumber - 1;
    }
    
    // Calculate the center angle of the target slot
    const targetSlotCenterAngle = (targetSlotIndex + 0.5) * slotAngle - Math.PI / 2;
    
    // Calculate rotations - wheel spins and stops with target number at pointer
    const wheelFullRotations = 5 + Math.random() * 3; // 5-8 rotations for wheel
    
    // The pointer is FIXED at -PI/2 (top)
    // We want the target slot's center to be at -PI/2 when wheel stops
    // Current angle of target slot center: targetSlotCenterAngle + initialWheelRotation
    // We want: targetSlotCenterAngle + finalWheelRotation = -PI/2
    // So: finalWheelRotation = -PI/2 - (targetSlotCenterAngle + initialWheelRotation) + initialWheelRotation
    // Simplified: finalWheelRotation = -PI/2 - targetSlotCenterAngle
    
    const adjustmentRotation = -Math.PI / 2 - targetSlotCenterAngle;
    
    // Normalize adjustment to [0, 2π]
    let normalizedAdjustment = adjustmentRotation;
    while (normalizedAdjustment < 0) normalizedAdjustment += Math.PI * 2;
    while (normalizedAdjustment >= Math.PI * 2) normalizedAdjustment -= Math.PI * 2;
    
    // Add full rotations for visual effect
    const wheelBaseRotation = wheelFullRotations * Math.PI * 2;
    this.targetWheelRotation = this.initialWheelRotation + wheelBaseRotation + normalizedAdjustment;
    
    // Ball spins independently for visual effect (doesn't determine winner)
    const ballFullRotations = 8 + Math.random() * 4; // 8-12 rotations for ball
    let currentBallAngle = this.initialBallRotation;
    while (currentBallAngle < 0) currentBallAngle += Math.PI * 2;
    while (currentBallAngle >= Math.PI * 2) currentBallAngle -= Math.PI * 2;
    let angleToTarget = targetSlotCenterAngle - currentBallAngle;
    while (angleToTarget < 0) angleToTarget += Math.PI * 2;
    this.targetBallRotation = this.initialBallRotation + ballFullRotations * Math.PI * 2 + angleToTarget;
    
    // Calculate initial velocities for physics-based movement
    const totalTime = this.duration / 1000; // 20 seconds
    const fps = 60;
    const totalFrames = totalTime * fps;
    const frictionPerFrame = this.friction * this.airResistance;
    const ballFrictionPerFrame = this.ballFriction * this.airResistance;
    
    // Calculate rotation distances
    const ballRotationDistance = Math.abs(this.targetBallRotation - this.initialBallRotation);
    const wheelRotationDistance = Math.abs(this.targetWheelRotation - this.initialWheelRotation);
    
    // Find correct initial velocities for both ball and wheel
    let testBallVel = 0.4;
    let testWheelVel = 0.2;
    let bestBallVel = testBallVel;
    let bestWheelVel = testWheelVel;
    let bestError = Infinity;
    
    for (let attempt = 0; attempt < 50; attempt++) {
      // Simulate ball
      let ballDist = 0;
      let ballVel = testBallVel;
      for (let f = 0; f < totalFrames; f++) {
        ballDist += ballVel;
        ballVel *= ballFrictionPerFrame;
        if (ballVel < 0.0001) break;
      }
      
      // Simulate wheel
      let wheelDist = 0;
      let wheelVel = testWheelVel;
      for (let f = 0; f < totalFrames; f++) {
        wheelDist += wheelVel;
        wheelVel *= frictionPerFrame;
        if (wheelVel < 0.0001) break;
      }
      
      const error = Math.abs(ballDist - ballRotationDistance) + Math.abs(wheelDist - wheelRotationDistance);
      if (error < bestError) {
        bestError = error;
        bestBallVel = testBallVel;
        bestWheelVel = testWheelVel;
        if (error < 0.2) break;
      }
      
      if (ballDist < ballRotationDistance) {
        testBallVel *= 1.02;
      } else {
        testBallVel *= 0.98;
      }
      
      if (wheelDist < wheelRotationDistance) {
        testWheelVel *= 1.02;
      } else {
        testWheelVel *= 0.98;
      }
    }
    
    // Set initial velocities (radians per frame)
    this.ballAngularVelocity = bestBallVel;
    this.wheelAngularVelocity = bestWheelVel; // Positive for forward rotation
    
    // Safety checks
    if (this.ballAngularVelocity < 0.05 || isNaN(this.ballAngularVelocity)) {
      const avgVel = ballRotationDistance / totalFrames;
      this.ballAngularVelocity = avgVel * 4;
    }
    if (Math.abs(this.wheelAngularVelocity) < 0.05 || isNaN(this.wheelAngularVelocity)) {
      const avgVel = wheelRotationDistance / totalFrames;
      this.wheelAngularVelocity = -avgVel * 2;
    }
  }
  
  update() {
    // Always update ticker spring (even when stopped, so it settles)
    this.updateTickerSpring(1 / 60);
    
    // Always update fireworks (even when stopped, so particles settle)
    this.updateFireworks(1/60);
    
    // Animate pointer pulsing glow for maximum visibility
    this.animatePointerGlow();
    
    // If already stopped, enforce frozen rotation and return
    if (!this.isSpinning) {
      // Reset fireworks timer when stopped
      this._fwTimer = 0;
      // ALWAYS use frozen rotation when stopped - never allow any drift
      if (this.wheelRotationFrozen && this.frozenWheelRotation !== undefined) {
        this.wheelGroup.rotation.y = this.frozenWheelRotation;
        // Also lock wheelRotation itself to prevent any calculations from using wrong value
        this.wheelRotation = this.frozenWheelRotation;
      }
      return false;
    }
    
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // ✅ CHECK FOR STOPPING BEFORE UPDATING PHYSICS - THIS IS CRITICAL
    // Check if wheel should stop - stop when velocities are very low OR time is up
    const shouldStop = progress >= 1 || (Math.abs(this.wheelAngularVelocity) < 0.001 && Math.abs(this.ballAngularVelocity) < 0.001 && elapsed > this.duration * 0.9);
    
    if (shouldStop) {
      // ✅ STOP IMMEDIATELY - FREEZE EVERYTHING BEFORE ANY MORE UPDATES
      this.isSpinning = false;

      // ✅ hard stop velocities FIRST (before any calculations)
      this.wheelAngularVelocity = 0;
      this.ballAngularVelocity = 0;

      // ✅ FREEZE wheelRotation at EXACT current value - NEVER UPDATE AGAIN
      // Store the frozen value AND lock wheelRotation itself
      const frozenRotation = this.wheelRotation;
      this.wheelRotation = frozenRotation; // Lock it immediately
      this.frozenWheelRotation = frozenRotation;
      this.wheelRotationFrozen = true;
      
      // Lock the visual rotation IMMEDIATELY
      this.wheelGroup.rotation.y = frozenRotation;
      
        // ✅ compute winner ONCE using FROZEN rotation value (wheelRotation is already frozen)
        if (this.finalWinningNumber == null) {
          const winner = this.getNumberAtPointer(); // Uses frozen wheelRotation now
          this.finalWinningNumber = winner;

          // Stop music so announcements can be heard
          if (this.casinoMusicSource) {
            try {
              this.casinoMusicSource.stop();
              this.casinoMusicSource = null;
              console.log('🔇 Music stopped - winning number selected');
            } catch (e) {
              // Ignore errors when stopping
            }
          }

          // Don't announce here - winner name will be announced in showWinningNumber() in main.js
          // The announcement will include both the number and winner name

          // highlight immediately (use stored winner)
          this.winningSlotIndex = this.numberToSlotIndex[winner] ?? -1;
          this.highlightWinningSlot();
        }

      return true;
    }
    
    // Only update physics if still spinning (we already checked shouldStop above)
    // Physics-based movement with more gradual deceleration
    // Apply friction - more gradual slowdown
    this.wheelAngularVelocity *= this.friction;
    this.ballAngularVelocity *= this.ballFriction;
    
    // Add air resistance - more gradual
    this.wheelAngularVelocity *= this.airResistance;
    this.ballAngularVelocity *= this.airResistance;
    
    // Add realistic wobble/bounce as it slows down (more subtle)
    // Wobble starts later for more dramatic slow-down effect
    const timeRatio = elapsed / this.duration;
    if (Math.abs(this.ballAngularVelocity) < 0.15 && timeRatio > 0.75) {
      const wobble = Math.sin(elapsed * 0.008) * 0.004 * (1 - timeRatio);
      this.ballAngularVelocity += wobble;
    }
    if (Math.abs(this.wheelAngularVelocity) < 0.1 && timeRatio > 0.75) {
      const wobble = Math.sin(elapsed * 0.008) * 0.002 * (1 - timeRatio);
      this.wheelAngularVelocity += wobble;
    }
    
    // Update rotations based on velocities (ONLY if still spinning)
    this.wheelRotation += this.wheelAngularVelocity;
    this.ballRotation += this.ballAngularVelocity;
    
    // Normalize rotations (keep in reasonable range)
    while (this.ballRotation > Math.PI * 4) this.ballRotation -= Math.PI * 2;
    while (this.ballRotation < -Math.PI * 2) this.ballRotation += Math.PI * 2;
    while (this.wheelRotation > Math.PI * 4) this.wheelRotation -= Math.PI * 2;
    while (this.wheelRotation < -Math.PI * 2) this.wheelRotation += Math.PI * 2;
    
    // Apply rotations
    this.wheelGroup.rotation.y = this.wheelRotation;
    this.updateBallPosition();
    
    // Rotate ball for visual effect
    if (Math.abs(this.ballAngularVelocity) > 0.01) {
      this.ball.rotation.x += Math.abs(this.ballAngularVelocity) * 0.5;
      this.ball.rotation.y += Math.abs(this.ballAngularVelocity) * 0.5;
    }
    
    // Spawn continuous bursts during spin
    const palette = [0xFFD700, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00, 0xFFA500];
    if (!this._fwTimer) this._fwTimer = 0;
    this._fwTimer += 1/60;
    if (this._fwTimer > 0.6) {
      this._fwTimer = 0;
      this.spawnBurst(
        new THREE.Vector3((Math.random()-0.5)*8, 4 + Math.random()*6, (Math.random()-0.5)*8),
        palette,
        1200,
        0.65,
        3.2
      );
    }
    
    // Update floating number animation
    if (this.floatingNumber) {
      this.animateFloatingNumber();
    }
    
    // Detect when ball passes slots and play click sound
    this.detectSlotPassing();
    
    return false; // Still spinning
  }
  
  animatePointerGlow() {
    // Simple pulsing glow for triangle pointer
    if (!this.fixedPointer) return;
    
    const time = Date.now() * 0.003;
    const pulse = Math.sin(time) * 0.3 + 0.7;
    
    if (this.fixedPointer.material) {
      this.fixedPointer.material.emissiveIntensity = 1.0 * pulse;
    }
  }
  
  spawnBurst(center, palette, count = 900, speed = 0.55, lifeSeconds = 2.8) {
    const { positions, velocities, colors, life, maxLife } = this.fireworksData;
    const start = this.particlesAlive;

    const take = Math.min(count, this.maxParticles - start);
    if (take <= 0) return;

    for (let i = 0; i < take; i++) {
      const idx = start + i;

      // random sphere direction (better distribution)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const s = speed * (0.35 + Math.random() * 0.85);

      const vx = Math.sin(phi) * Math.cos(theta) * s;
      const vy = Math.cos(phi) * s + 0.12; // bias upward
      const vz = Math.sin(phi) * Math.sin(theta) * s;

      positions[idx * 3 + 0] = center.x;
      positions[idx * 3 + 1] = center.y;
      positions[idx * 3 + 2] = center.z;

      velocities[idx * 3 + 0] = vx;
      velocities[idx * 3 + 1] = vy;
      velocities[idx * 3 + 2] = vz;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[idx * 3 + 0] = ((c >> 16) & 255) / 255;
      colors[idx * 3 + 1] = ((c >> 8) & 255) / 255;
      colors[idx * 3 + 2] = (c & 255) / 255;

      maxLife[idx] = lifeSeconds * (0.6 + Math.random() * 0.8);
      life[idx] = maxLife[idx];
    }

    this.particlesAlive += take;
    this.fireworksGeo.attributes.position.needsUpdate = true;
    this.fireworksGeo.attributes.velocity.needsUpdate = true;
    this.fireworksGeo.attributes.color.needsUpdate = true;
    this.fireworksGeo.attributes.life.needsUpdate = true;
    this.fireworksGeo.attributes.maxLife.needsUpdate = true;
  }
  
  updateFireworks(dt = 1/60) {
    if (!this.fireworksPoints) return;

    const g = -0.85;          // gravity
    const drag = 0.985;       // air resistance
    const { positions, velocities, life, maxLife, colors } = this.fireworksData;

    let write = 0;

    for (let i = 0; i < this.particlesAlive; i++) {
      const L = life[i] - dt;
      if (L <= 0) continue;

      // keep particle: compact arrays (fast "remove")
      life[write] = L;
      maxLife[write] = maxLife[i];

      const px = positions[i*3+0];
      const py = positions[i*3+1];
      const pz = positions[i*3+2];

      let vx = velocities[i*3+0] * drag;
      let vy = (velocities[i*3+1] + g * dt) * drag;
      let vz = velocities[i*3+2] * drag;

      positions[write*3+0] = px + vx;
      positions[write*3+1] = py + vy;
      positions[write*3+2] = pz + vz;

      velocities[write*3+0] = vx;
      velocities[write*3+1] = vy;
      velocities[write*3+2] = vz;

      // copy colors too
      colors[write*3+0] = colors[i*3+0];
      colors[write*3+1] = colors[i*3+1];
      colors[write*3+2] = colors[i*3+2];

      write++;
    }

    this.particlesAlive = write;

    this.fireworksGeo.setDrawRange(0, this.particlesAlive);
    this.fireworksGeo.attributes.position.needsUpdate = true;
    this.fireworksGeo.attributes.velocity.needsUpdate = true;
    this.fireworksGeo.attributes.color.needsUpdate = true;
    this.fireworksGeo.attributes.life.needsUpdate = true;
  }
  
  
  detectSlotPassing() {
    // Get current slot at TOP pointer (pointer determines clicks and winner)
    const currentSlotIndex = this.getNumberAtPointer() - 1; // Convert to 0-based index
    
    // If pointer has moved to a new slot, play click sound and kick ticker
    if (currentSlotIndex !== this.lastSlotIndex && this.lastSlotIndex !== -1) {
      this.playClickSound();
      this.kickTicker(); // Kick the ticker flap
    }
    
    this.lastSlotIndex = currentSlotIndex;
  }
  
  kickTicker() {
    // Kick backwards like a real flapper hitting a divider
    // Negative rotation around X makes it "snap" up/back then spring down
    if (this.tickerPivot) {
      this.tickerVel -= this.tickerKick;
    }
  }
  
  updateTickerSpring(dt) {
    if (!this.tickerPivot) return;

    // When wheel is stopped, let it settle smoothly to rest
    const target = this.tickerRest;

    // Spring physics: a = -k(x-target) - d*v
    const a = -this.tickerK * (this.tickerAngle - target) - this.tickerDamp * this.tickerVel;

    this.tickerVel += a * dt;
    this.tickerAngle += this.tickerVel * dt;

    // clamp so it doesn't go crazy
    this.tickerAngle = Math.max(-0.9, Math.min(0.35, this.tickerAngle));

    // Apply hinge rotation
    this.tickerPivot.rotation.x = this.tickerAngle;
  }
  
  speakWinningNumber(number, winnerName = null) {
    // Text-to-speech announcement: "And the winning number is..." and "And the winner is..."
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Load voices if needed
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          this.speakWinningNumber(number, winnerName);
        }, { once: true });
        return;
      }
      
      // Create announcement with number and winner name
      let announcement = `And the winning number is... ${number}!`;
      if (winnerName && winnerName.trim() && winnerName !== 'Unnamed' && winnerName !== 'No winner selected') {
        announcement += ` And the winner is... ${winnerName}!`;
      }
      
      const utterance = new SpeechSynthesisUtterance(announcement);
      
      // More dramatic settings
      utterance.rate = 0.85; // Slightly slower for emphasis
      utterance.pitch = 1.2; // Higher pitch for excitement
      utterance.volume = 1.0; // Maximum volume
      
      // Try to use a more natural, expressive voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Zira') ||
        voice.name.includes('David') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else if (voices.length > 0) {
        // Fallback to first English voice
        const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        utterance.voice = englishVoice;
      }
      
      // Speak the announcement
      speechSynthesis.speak(utterance);
      
      // Log for debugging
      console.log(`Announcing: "${announcement}"`);
    } else {
      // Fallback if speech synthesis not available
      console.log(`And the winning number is... ${number}!`);
    }
  }
  
  initCasinoMusic() {
    // Initialize casino background music
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Create a casino-style background music loop (upbeat, celebratory)
      const sampleRate = this.audioContext.sampleRate;
      const duration = 8.0; // 8 second loop
      const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          
          // Create upbeat casino music with multiple notes
          const baseFreq = 261.63; // C4
          const notes = [
            baseFreq,           // C
            baseFreq * 1.25,    // E
            baseFreq * 1.5,     // G
            baseFreq * 1.875,   // B
            baseFreq * 2        // C5
          ];
          
          let sample = 0;
          notes.forEach((freq, idx) => {
            const noteTime = (t + idx * 0.1) % 2;
            const envelope = Math.exp(-noteTime * 0.5) * (1 - noteTime / 2);
            sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.15;
          });
          
          // Add some rhythm
          const beat = Math.sin(t * 2) > 0 ? 1 : 0.7;
          data[i] = sample * beat;
        }
      }
      
      this.casinoMusicBuffer = buffer;
    } catch (e) {
      console.warn('Could not initialize casino music:', e);
    }
  }
  
  playCasinoMusic() {
    // Play casino background music in a loop while spinning
    // Stop existing music if playing
    if (this.casinoMusicSource) {
      try {
        this.casinoMusicSource.stop();
        this.casinoMusicSource = null;
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    
    if (this.audioContext && this.casinoMusicBuffer) {
      try {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        this.casinoMusicSource = this.audioContext.createBufferSource();
        this.casinoMusicSource.buffer = this.casinoMusicBuffer;
        this.casinoMusicSource.loop = true;
        this.casinoMusicSource.connect(this.audioContext.destination);
        this.casinoMusicSource.start(0);
        
        // Stop after 25 seconds (longer than spin duration)
        setTimeout(() => {
          if (this.casinoMusicSource) {
            try {
              this.casinoMusicSource.stop();
            } catch (e) {
              // Ignore errors
            }
            this.casinoMusicSource = null;
          }
        }, 25000);
      } catch (e) {
        console.warn('Could not play casino music:', e);
      }
    }
  }
  
  createFireworks(winningNumber) {
    // Initial burst when spin starts (continuous bursts happen in update())
    const palette = [0xFFD700, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00, 0xFFA500];
    this.spawnBurst(
      new THREE.Vector3((Math.random()-0.5)*8, 4 + Math.random()*6, (Math.random()-0.5)*8),
      palette,
      1200,
      0.65,
      3.2
    );
  }
  
  createCasinoWinFireworks(winningNumber) {
    // Giant finale at stop - overwhelming celebratory bursts
    const palette = [0xFFD700, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00, 0xFFA500];
    
    // Get winning slot position for centered burst
    if (this.winningSlotIndex >= 0 && this.winningSlotIndex < this.slotMeshes.length) {
      const winningSlot = this.slotMeshes[this.winningSlotIndex];
      const slotIndex = winningSlot.userData.slotIndex;
      const slotAngle = (Math.PI * 2) / this.NUM_SLOTS;
      const slotCenterAngle = (slotIndex + 0.5) * slotAngle - Math.PI / 2;
      const slotRadius = (this.OUTER_RADIUS + this.INNER_RADIUS) / 2;
      
      const burstX = Math.cos(slotCenterAngle) * slotRadius;
      const burstY = this.WHEEL_HEIGHT / 2 + 0.5;
      const burstZ = Math.sin(slotCenterAngle) * slotRadius;
      
      // Giant center burst
      this.spawnBurst(new THREE.Vector3(burstX, burstY, burstZ), palette, 3500, 0.9, 4.0);
      
      // Additional massive bursts around it
      setTimeout(() => {
        this.spawnBurst(new THREE.Vector3(burstX + 2, burstY + 1, burstZ - 2), palette, 2500, 0.85, 4.0);
      }, 200);
      setTimeout(() => {
        this.spawnBurst(new THREE.Vector3(burstX - 2, burstY + 1, burstZ + 2), palette, 2500, 0.85, 4.0);
      }, 400);
    } else {
      // Fallback: center bursts
      this.spawnBurst(new THREE.Vector3(0, 6, 0), palette, 3500, 0.9, 4.0);
      setTimeout(() => {
        this.spawnBurst(new THREE.Vector3(2, 7, -2), palette, 2500, 0.85, 4.0);
      }, 200);
      setTimeout(() => {
        this.spawnBurst(new THREE.Vector3(-2, 7, 2), palette, 2500, 0.85, 4.0);
      }, 400);
    }
  }
  
  highlightWinningSlot() {
    // Highlight the winning slot with glow effect, play casino sound, speech, fireworks, and sparkles
    if (this.winningSlotIndex >= 0 && this.winningSlotIndex < this.slotMeshes.length) {
      const winningSlot = this.slotMeshes[this.winningSlotIndex];
      const winningNumber = winningSlot.userData.actualNumber || (this.winningSlotIndex + 1);
      
      // Play casino win sound
      this.playWinSound();
      
      // Play casino background music
      this.playCasinoMusic();
      
      // Create casino-like winning fireworks (celebratory, not random)
      this.createCasinoWinFireworks(winningNumber);
      
      // Create sparkles around winning number
      this.createSparkles(winningSlot);
      
      // Create pulsing highlight effect
      const originalEmissive = winningSlot.material.emissive.clone();
      const originalEmissiveIntensity = winningSlot.material.emissiveIntensity;
      
      // Animate highlight
      let highlightTime = 0;
      const highlightInterval = setInterval(() => {
        highlightTime += 0.1;
        const pulse = Math.sin(highlightTime * 2) * 0.5 + 0.5;
        winningSlot.material.emissiveIntensity = originalEmissiveIntensity + pulse * 0.8;
        
        // Also make ticker flap glow
        if (this.tickerFlap && this.tickerFlap.material) {
          this.tickerFlap.material.emissiveIntensity = 0.15 + pulse * 0.3;
        }
        
        // Make pointer glow brighter when number is selected
        if (this.fixedPointer && this.fixedPointer.children) {
          this.fixedPointer.children.forEach((child, index) => {
            if (child.material) {
              // Head is brighter than shaft
              const baseIntensity = index === 1 ? 2.0 : 1.5; // Head (index 1) vs Shaft (index 0)
              child.material.emissiveIntensity = baseIntensity + pulse * 1.0;
            }
          });
        }
        
        // Stop after 5 seconds (longer for fireworks)
        if (highlightTime > 5) {
          clearInterval(highlightInterval);
          winningSlot.material.emissiveIntensity = originalEmissiveIntensity;
          if (this.tickerFlap && this.tickerFlap.material) {
            this.tickerFlap.material.emissiveIntensity = 0.15;
          }
          if (this.fixedPointer && this.fixedPointer.children) {
            this.fixedPointer.children.forEach((child, index) => {
              if (child.material) {
                // Reset to base intensity
                const baseIntensity = index === 1 ? 2.0 : 1.5; // Head vs Shaft
                child.material.emissiveIntensity = baseIntensity;
              }
            });
          }
        }
      }, 100);
    }
  }
  
  reset() {
    // DO NOT reset positions - keep wheel and ball in exact position
    this.isSpinning = false;
    this.targetNumber = null;
    this.wheelAngularVelocity = 0;
    this.ballAngularVelocity = 0;
    this.winningSlotIndex = -1;
    this.lastSlotIndex = -1;
    
    // Reset all slot highlights
    this.slotMeshes.forEach(slot => {
      if (slot.material.emissiveIntensity) {
        slot.material.emissiveIntensity = slot.material.color.r > 0.5 ? 0.2 : 0.05;
      }
    });
    
    // Reset ball rotation visual
    if (this.ball) {
      this.ball.rotation.x = 0;
      this.ball.rotation.y = 0;
    }
  }
  
  createFloatingWinningNumber(number) {
    // Create massive floating animated winning number with fireworks
    // Remove existing floating number if any
    if (this.floatingNumber) {
      this.scene.remove(this.floatingNumber);
      this.floatingNumber.material.dispose();
      this.floatingNumber.material.map.dispose();
    }
    
    // Create canvas for number texture - MUCH LARGER
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // Draw MASSIVE number with multiple glows
    const numStr = number.toString();
    
    // Outer glow (multiple layers for intense effect)
    for (let i = 5; i > 0; i--) {
      context.shadowBlur = 30 * i;
      context.shadowColor = `rgba(255, 215, 0, ${0.3 / i})`;
      context.fillStyle = `rgba(255, 215, 0, ${0.1 / i})`;
      context.font = `bold ${800 + i * 20}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(numStr, 512, 512);
    }
    
    // Main number with black outline
    context.shadowBlur = 0;
    context.fillStyle = '#FF0000'; // Bright red
    context.strokeStyle = '#000000';
    context.lineWidth = 40;
    context.font = 'bold 800px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw with thick outline
    context.strokeText(numStr, 512, 512);
    context.fillText(numStr, 512, 512);
    
    // Inner glow
    context.fillStyle = '#FFFF00';
    context.font = 'bold 750px Arial';
    context.globalCompositeOperation = 'source-over';
    context.fillText(numStr, 512, 512);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create massive 3D sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(6, 6, 1); // MASSIVE size - doubled
    sprite.position.set(0, 6, 0); // Start higher above wheel
    sprite.userData = {
      startTime: Date.now(),
      number: number,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        0.05,
        (Math.random() - 0.5) * 0.1
      ),
      rotationSpeed: (Math.random() - 0.5) * 0.02
    };
    
    this.scene.add(sprite);
    this.floatingNumber = sprite;
    
    // Create fireworks around the number
    this.createFloatingNumberFireworks(sprite.position);
  }
  
  createFloatingNumberFireworks(position) {
    // Create fireworks around the floating number using particle system
    const palette = [0xFFD700, 0xFFFF00, 0xFFA500, 0xFF0000];
    
    for (let burst = 0; burst < 4; burst++) {
      setTimeout(() => {
        this.spawnBurst(
          new THREE.Vector3(position.x, position.y, position.z),
          palette,
          600,
          0.5,
          3.0
        );
      }, burst * 500);
    }
  }
  
  animateFloatingNumber() {
    if (!this.floatingNumber) return;
    
    const elapsed = (Date.now() - this.floatingNumber.userData.startTime) / 1000;
    
    // Move number across screen
    this.floatingNumber.position.add(this.floatingNumber.userData.velocity);
    
    // Add floating/bobbing motion
    this.floatingNumber.position.y += Math.sin(elapsed * 2) * 0.05;
    
    // Rotate slowly
    this.floatingNumber.rotation.z += this.floatingNumber.userData.rotationSpeed;
    
    // Scale pulse - more dramatic
    const pulse = 1 + Math.sin(elapsed * 4) * 0.3;
    this.floatingNumber.scale.setScalar(6 * pulse);
    
    // Add rotation animation
    this.floatingNumber.rotation.z += 0.01;
    
    // Add color pulse effect
    if (this.floatingNumber.material) {
      const colorPulse = Math.sin(elapsed * 2) * 0.3 + 0.7;
      this.floatingNumber.material.opacity = colorPulse;
    }
    
    // Fade out after 8 seconds
    if (elapsed < 8) {
      this.floatingNumber.material.opacity = 1.0;
    } else if (elapsed < 10) {
      this.floatingNumber.material.opacity = 1.0 - (elapsed - 8) / 2;
    } else {
      // Remove after fade
      this.scene.remove(this.floatingNumber);
      this.floatingNumber.material.dispose();
      this.floatingNumber.material.map.dispose();
      this.floatingNumber = null;
      return;
    }
  }
  
  getGroup() {
    return this.group;
  }
}

