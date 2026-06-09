// face-engine.js
// Face Recognition & Anti-Spoofing Liveness Engine

class FaceRecognitionEngine {
  constructor() {
    this.modelsLoaded = false;
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.stream = null;
    this.animationFrameId = null;
    
    // Face Recognition matcher
    this.faceMatcher = null;
    this.registeredStudents = [];
    
    // Anti-Spoofing & Liveness State Machine
    this.livenessStatus = 'WAITING'; // 'WAITING', 'CHALLENGING', 'PASSED', 'FAILED'
    this.challenges = ['BLINK', 'TURN_LEFT', 'TURN_RIGHT', 'SMILE'];
    this.currentChallengeIndex = 0;
    this.challengeQueue = [];
    this.challengeTimeout = null;
    this.challengeStartTime = 0;
    this.challengeDuration = 6000; // 6 seconds per challenge
    this.challengeProgress = 0;
    
    // Liveness Detection Variables
    this.blinkCount = 0;
    this.wasEyeOpen = true;
    this.smileBaseline = null;
    this.headTurnBaseline = null;
    this.lastDetectedStudentId = null;
    this.lastDetectedDescriptor = null;
    
    // Demo Spoof Override
    this.simulateSpoofActive = false;
    this.simulateQRCodeMatch = null; // Stored student ID when scanning simulated QR code
    
    // Callbacks
    this.onStatusChange = null;
    this.onLivenessPassed = null;
    this.onLivenessFailed = null;
  }

  // Load Neural Network Weights
  async loadModels() {
    if (this.modelsLoaded) return;
    
    // We check if faceapi is available globally
    if (typeof faceapi === 'undefined') {
      throw new Error('face-api.js is not loaded. Ensure the CDN script is included.');
    }

    try {
      // Load Tiny Face Detector, 68 Landmark, and Face Recognition Models
      // Try local path first (relative to index.html), then fallback to CDN
      const paths = ['./models', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/'];
      
      let loaded = false;
      for (const modelPath of paths) {
        try {
          console.log(`Attempting to load weights from: ${modelPath}`);
          await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
          await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
          await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
          loaded = true;
          console.log('Weights loaded successfully!');
          break;
        } catch (e) {
          console.warn(`Failed loading from ${modelPath}, trying next path...`);
        }
      }

      if (!loaded) {
        throw new Error('Could not load face-api weights from local or CDN directories.');
      }

      this.modelsLoaded = true;
    } catch (err) {
      console.error('Error loading face-api models:', err);
      throw err;
    }
  }

  // Set Registered Students for Face Matcher
  updateFaceMatcher(students) {
    this.registeredStudents = students.filter(s => s.faceRegistered && s.faceDescriptor);
    
    if (this.registeredStudents.length === 0) {
      this.faceMatcher = null;
      return;
    }

    // Convert saved descriptors back to Float32Array
    const labeledDescriptors = this.registeredStudents.map(student => {
      let descriptor = student.faceDescriptor;
      if (!(descriptor instanceof Float32Array)) {
        // If it was stored as an ordinary array in IndexedDB
        descriptor = new Float32Array(descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(student.id, [descriptor]);
    });

    // 0.6 threshold is more forgiving and improves recognition rate
    this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  }

  // Start Webcam Stream
  async startCamera(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    this.ctx = canvasEl.getContext('2d');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      this.videoElement.srcObject = this.stream;
      
      // Play once loaded
      await new Promise(resolve => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      // Align canvas dimensions with video
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;

      // Start processing loop
      this.resetLiveness();
      this.startProcessingLoop();
      
      if (this.onStatusChange) this.onStatusChange('CAMERA_ACTIVE');
    } catch (err) {
      console.error('Error opening webcam:', err);
      if (this.onStatusChange) this.onStatusChange('CAMERA_ERROR');
      throw err;
    }
  }

  // Stop Webcam Stream
  stopCamera() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.challengeTimeout) {
      clearTimeout(this.challengeTimeout);
      this.challengeTimeout = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.resetLiveness();
    if (this.onStatusChange) this.onStatusChange('INACTIVE');
  }

  // Initialize/Reset Liveness Challenges
  resetLiveness() {
    this.livenessStatus = 'WAITING';
    this.challengeQueue = [];
    this.currentChallengeIndex = 0;
    this.blinkCount = 0;
    this.wasEyeOpen = true;
    this.smileBaseline = null;
    this.headTurnBaseline = null;
    this.lastDetectedStudentId = null;
    this.lastDetectedDescriptor = null;
    
    if (this.challengeTimeout) {
      clearTimeout(this.challengeTimeout);
      this.challengeTimeout = null;
    }
  }

  // Generate Liveness Challenges (2 random challenges for verification)
  generateChallengeQueue() {
    // Select 2 random challenges
    const shuffled = [...this.challenges].sort(() => 0.5 - Math.random());
    this.challengeQueue = shuffled.slice(0, 2);
    this.currentChallengeIndex = 0;
    this.livenessStatus = 'CHALLENGING';
    this.startChallenge(this.challengeQueue[0]);
  }

  // Start a specific Challenge
  startChallenge(challengeType) {
    this.challengeStartTime = Date.now();
    this.blinkCount = 0;
    this.wasEyeOpen = true;
    
    console.log(`Starting Challenge: ${challengeType}`);
    
    if (this.challengeTimeout) clearTimeout(this.challengeTimeout);
    
    this.challengeTimeout = setTimeout(() => {
      // Challenge timed out -> Failed liveness (Proxy/Photo detected!)
      this.failLiveness('Challenge Timeout - Liveness Verification Failed');
    }, this.challengeDuration);
  }

  // Liveness Passed
  passLiveness() {
    if (this.challengeTimeout) clearTimeout(this.challengeTimeout);
    this.livenessStatus = 'PASSED';
    console.log('Liveness Passed!');
    
    if (this.onLivenessPassed) {
      this.onLivenessPassed(this.lastDetectedStudentId, this.lastDetectedDescriptor);
    }
  }

  // Liveness Failed (Spoofing Detected)
  failLiveness(reason) {
    if (this.challengeTimeout) clearTimeout(this.challengeTimeout);
    this.livenessStatus = 'FAILED';
    console.error('Liveness Failed:', reason);
    
    if (this.onLivenessFailed) {
      this.onLivenessFailed(this.lastDetectedStudentId, reason);
    }
  }

  // Core Processing Loop
  startProcessingLoop() {
    const processFrame = async () => {
      if (!this.stream) return; // Stopped

      try {
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Detect single face with landmarks & descriptor
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 });
        const detection = await faceapi.detectSingleFace(this.videoElement, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const { box, score } = detection.detection;
          const landmarks = detection.landmarks;
          const descriptor = detection.descriptor;

          // Draw Bounding Box & HUD
          this.drawHUD(box, score);

          // Draw Face Mesh landmarks
          this.drawLandmarks(landmarks);

          // Force Spoof Simulation Override
          if (this.simulateSpoofActive) {
            this.drawAlertBox(box, 'SPOOF DETECTED: 2D PHOTO REPLAY');
            if (this.livenessStatus !== 'FAILED') {
              this.failLiveness('2D Screen/Photo Spoof Detected');
            }
          } else {
            // Standard Anti-Spoofing / Liveness Check
            await this.processLiveness(landmarks, box, descriptor);
          }
        } else {
          // No face detected -> Reset
          if (this.livenessStatus === 'CHALLENGING') {
            this.resetLiveness();
          }
          this.drawWaitingHUD();
        }

      } catch (err) {
        console.error('Error processing video frame:', err);
      }

      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  // Liveness Calculations and Checks
  async processLiveness(landmarks, box, descriptor) {
    // 1. Identify/Recognize Face first, if we have a faceMatcher
    if (!this.lastDetectedStudentId && this.faceMatcher) {
      const match = this.faceMatcher.findBestMatch(descriptor);
      if (match && match.label !== 'unknown') {
        this.lastDetectedStudentId = match.label;
        this.lastDetectedDescriptor = descriptor;
      } else {
        this.lastDetectedStudentId = 'Guest/Unregistered';
        this.lastDetectedDescriptor = descriptor;
      }
    }

    // QR Code Check-In Override: If student scanned a secure rotating QR code on mobile,
    // we bypass the normal face matching since the QR code matches the student,
    // but we STILL run the liveness facial check!
    if (this.simulateQRCodeMatch) {
      this.lastDetectedStudentId = this.simulateQRCodeMatch;
      this.lastDetectedDescriptor = descriptor;
    }

    // 2. Start challenges once we have a stable face
    if (this.livenessStatus === 'WAITING') {
      this.generateChallengeQueue();
      return;
    }

    if (this.livenessStatus === 'CHALLENGING') {
      const currentChallenge = this.challengeQueue[this.currentChallengeIndex];
      const elapsed = Date.now() - this.challengeStartTime;
      this.challengeProgress = Math.min(100, (elapsed / this.challengeDuration) * 100);

      // Verify if current challenge was met
      let challengeMet = false;

      if (currentChallenge === 'BLINK') {
        challengeMet = this.checkBlink(landmarks);
      } else if (currentChallenge === 'TURN_LEFT') {
        challengeMet = this.checkHeadTurn(landmarks, 'LEFT');
      } else if (currentChallenge === 'TURN_RIGHT') {
        challengeMet = this.checkHeadTurn(landmarks, 'RIGHT');
      } else if (currentChallenge === 'SMILE') {
        challengeMet = this.checkSmile(landmarks);
      }

      if (challengeMet) {
        console.log(`✓ Challenge ${currentChallenge} Met!`);
        this.currentChallengeIndex++;
        
        if (this.currentChallengeIndex >= this.challengeQueue.length) {
          // All challenges completed!
          this.passLiveness();
        } else {
          // Next challenge
          this.startChallenge(this.challengeQueue[this.currentChallengeIndex]);
        }
      }
    }
  }

  // --- LIVENESS CRITERIA CALCULATIONS ---

  // Calculate Euclidean Distance
  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Eye Aspect Ratio (EAR) for Blink Detection
  getEAR(eyePoints) {
    // Landmarks layout: Left eye points: 36,37,38,39,40,41 relative to 0-67 array
    // Vertical distances: p2-p6, p3-p5
    // Horizontal distance: p1-p4
    const p1 = eyePoints[0];
    const p2 = eyePoints[1];
    const p3 = eyePoints[2];
    const p4 = eyePoints[3];
    const p5 = eyePoints[4];
    const p6 = eyePoints[5];

    const vertical1 = this.getDistance(p2, p6);
    const vertical2 = this.getDistance(p3, p5);
    const horizontal = this.getDistance(p1, p4);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  checkBlink(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const earLeft = this.getEAR(leftEye);
    const earRight = this.getEAR(rightEye);
    const ear = (earLeft + earRight) / 2.0;

    // Threshold: Closed eye EAR < 0.22, Open eye EAR > 0.26
    const eyeOpen = ear > 0.25;
    
    if (this.wasEyeOpen && !eyeOpen) {
      // transition from open to closed (downward motion of eyelid)
      this.wasEyeOpen = false;
    } else if (!this.wasEyeOpen && eyeOpen) {
      // transition from closed to open (upward motion) -> Blink!
      this.wasEyeOpen = true;
      this.blinkCount++;
      console.log(`Blink detected! Count: ${this.blinkCount}`);
    }

    // We require 1 clear blink to pass this challenge
    return this.blinkCount >= 1;
  }

  checkHeadTurn(landmarks, direction) {
    const jawPoints = landmarks.getJawOutline();
    const nosePoints = landmarks.getNose();

    // Jaw extreme corners: points 0 and 16. Nose tip: point 30 (index 4 of Nose array)
    const jawLeft = jawPoints[0];
    const jawRight = jawPoints[16];
    const noseTip = nosePoints[4]; // Point 30

    const distLeft = this.getDistance(noseTip, jawLeft);
    const distRight = this.getDistance(noseTip, jawRight);
    
    const turnRatio = distLeft / distRight;

    // Baseline: facing center is around 1.0 (between 0.8 and 1.25)
    // Turning right: nose tip moves closer to right jaw -> distLeft increases, distRight decreases -> ratio increases (> 2.0)
    // Turning left: nose tip moves closer to left jaw -> distLeft decreases, distRight increases -> ratio decreases (< 0.5)

    if (direction === 'LEFT' && turnRatio < 0.6) {
      return true;
    }
    if (direction === 'RIGHT' && turnRatio > 1.7) {
      return true;
    }
    return false;
  }

  checkSmile(landmarks) {
    const jawPoints = landmarks.getJawOutline();
    const mouthPoints = landmarks.getMouth();

    // Mouth corners: outer points 48 (index 0) and 54 (index 6)
    const mouthLeft = mouthPoints[0];
    const mouthRight = mouthPoints[6];
    const mouthWidth = this.getDistance(mouthLeft, mouthRight);

    // Normalize width against face width (jaw left to jaw right distance)
    const jawLeft = jawPoints[0];
    const jawRight = jawPoints[16];
    const faceWidth = this.getDistance(jawLeft, jawRight);

    const smileRatio = mouthWidth / faceWidth;

    // Smile ratio increases when smiling because lips stretch sideways
    // Neutral is usually ~0.35, smile stretches it past 0.43
    return smileRatio > 0.42;
  }

  // --- DRAWING FUNCTIONS ON CANVAS OVERLAY ---

  drawWaitingHUD() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 6]);
    this.ctx.strokeRect(80, 60, this.canvasElement.width - 160, this.canvasElement.height - 120);
    this.ctx.setLineDash([]);

    this.ctx.font = '14px Outfit';
    this.ctx.fillStyle = '#9ea4c1';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('POSITION YOUR FACE INSIDE THE FRAME', this.canvasElement.width / 2, this.canvasElement.height / 2);
  }

  drawHUD(box, score) {
    const x = box.x;
    const y = box.y;
    const w = box.width;
    const h = box.height;

    // Set HUD color based on liveness status
    let color = '#00f2fe'; // Cyan
    if (this.livenessStatus === 'PASSED') color = '#05ffb0'; // Emerald Green
    if (this.livenessStatus === 'FAILED' || this.simulateSpoofActive) color = '#ff3366'; // Pink/Red

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    
    // Draw high-tech bounding box (corner brackets only for aesthetics)
    const len = Math.min(w, h) * 0.15;
    
    // Top-Left Corner
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + len);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x + len, y);
    this.ctx.stroke();

    // Top-Right Corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + w - len, y);
    this.ctx.lineTo(x + w, y);
    this.ctx.lineTo(x + w, y + len);
    this.ctx.stroke();

    // Bottom-Left Corner
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + h - len);
    this.ctx.lineTo(x, y + h);
    this.ctx.lineTo(x + len, y + h);
    this.ctx.stroke();

    // Bottom-Right Corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + w - len, y + h);
    this.ctx.lineTo(x + w, y + h);
    this.ctx.lineTo(x + w, y + h - len);
    this.ctx.stroke();

    // Draw status tag
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 11px JetBrains Mono';
    this.ctx.textAlign = 'left';
    
    const textY = y - 10 > 20 ? y - 10 : y + 20;
    
    let text = `LIVENESS: ${this.livenessStatus}`;
    if (this.livenessStatus === 'CHALLENGING') {
      const challenge = this.challengeQueue[this.currentChallengeIndex];
      text = `LIVENESS: CHALLENGING [${challenge}]`;
    }
    
    this.ctx.fillText(text, x, textY);
    
    // Draw student ID if matching
    if (this.lastDetectedStudentId) {
      const labelText = `USER: ${this.lastDetectedStudentId}`;
      this.ctx.fillText(labelText, x, y + h + 20);
    }
  }

  drawAlertBox(box, message) {
    this.ctx.strokeStyle = '#ff3366';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(box.x, box.y, box.width, box.height);

    this.ctx.fillStyle = '#ff3366';
    this.ctx.font = 'bold 12px JetBrains Mono';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, box.x + box.width / 2, box.y - 12);
  }

  drawLandmarks(landmarks) {
    const points = landmarks.positions;
    this.ctx.fillStyle = this.livenessStatus === 'FAILED' ? '#ff3366' : '#00f2fe';
    
    // Draw 68 points as tiny circles
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }
}

// Instantiate and expose globally
const faceEngine = new FaceRecognitionEngine();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = faceEngine;
} else {
  window.faceEngine = faceEngine;
}
