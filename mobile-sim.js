// mobile-sim.js
// Student Mobile Simulator & Secure Rotating QR Code Controller

class StudentMobileSimulator {
  constructor() {
    this.currentStudent = null;
    this.gpsOnCampus = true;
    this.qrRotationTimer = null;
    this.secondsLeft = 10;
    this.otpToken = '';
    
    // UI Elements inside the simulator
    this.studentSelectEl = null;
    this.avatarEl = null;
    this.nameEl = null;
    this.idEl = null;
    this.qrImageEl = null;
    this.qrTimerTextEl = null;
    this.gpsDotEl = null;
    this.gpsStatusTextEl = null;
    this.personalRateEl = null;
    this.personalChartRing = null;
    
    // Callbacks
    this.onQRUpdated = null;
  }

  // Initialize UI Hooks
  init(hooks) {
    this.studentSelectEl = hooks.studentSelect;
    this.avatarEl = hooks.avatar;
    this.nameEl = hooks.name;
    this.idEl = hooks.id;
    this.qrImageEl = hooks.qrImage;
    this.qrTimerTextEl = hooks.qrTimerText;
    this.gpsDotEl = hooks.gpsDot;
    this.gpsStatusTextEl = hooks.gpsStatusText;
    this.personalRateEl = hooks.personalRate;
    this.personalChartRing = hooks.personalChartRing;
    
    this.setupEventListeners(hooks.gpsToggle);
    this.startQRRotation();
  }

  setupEventListeners(gpsToggleBtn) {
    // 1. Student dropdown change handler
    if (this.studentSelectEl) {
      this.studentSelectEl.addEventListener('change', async (e) => {
        const studentId = e.target.value;
        await this.loadStudent(studentId);
      });
    }

    // 2. GPS geofence toggle handler
    if (gpsToggleBtn) {
      gpsToggleBtn.addEventListener('click', () => {
        this.gpsOnCampus = !this.gpsOnCampus;
        this.updateGPSUI();
      });
    }
  }

  // Populate students list in mobile selector
  populateStudentSelector(students) {
    if (!this.studentSelectEl) return;
    
    this.studentSelectEl.innerHTML = '';
    
    // Sort students by name
    const sorted = students;
    
    sorted.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.name} (${student.id.split('-')[0]})`;
      this.studentSelectEl.appendChild(option);
    });

    // Load first student by default
    if (sorted.length > 0) {
      this.loadStudent(sorted[0].id);
    }
  }

  // Load selected student data and personal metrics
  async loadStudent(studentId) {
    if (!window.db) return;
    
    try {
      const student = await window.db.getStudentById(studentId);
      if (!student) return;

      this.currentStudent = student;
      
      // Update basic details
      if (this.avatarEl) this.avatarEl.src = student.avatar;
      if (this.nameEl) this.nameEl.textContent = student.name;
      if (this.idEl) this.idEl.textContent = student.id;

      // Calculate personal attendance rate
      const logs = await window.db.getAttendanceLogs();
      const studentLogs = logs.filter(l => l.studentId === student.id);
      
      let rate = 0;
      if (studentLogs.length > 0) {
        const attended = studentLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
        rate = (attended / studentLogs.length) * 100;
      } else {
        rate = 85.0; // Default fallback if no history
      }

      if (this.personalRateEl) {
        this.personalRateEl.textContent = `${rate.toFixed(1)}%`;

if (rate < 75) {
  this.personalRateEl.style.color = "#ff4d4d";
  alert("Warning: Attendance below 75%");
} else {
  this.personalRateEl.style.color = "#00ff99";
}
      }

      // Update rotating SVG progress circle if exists
      if (this.personalChartRing) {
        // Circumference is 2 * pi * r = 2 * 3.14 * 28 = ~176
        const circumference = 176;
        const offset = circumference - (rate / 100) * circumference;
        this.personalChartRing.style.strokeDashoffset = offset;
      }

      // Force refresh QR code
      this.updateQRCode();
    } catch (err) {
      console.error('Error loading student in mobile simulator:', err);
    }
  }

  // Toggle GPS mock geofence
  updateGPSUI() {
    if (this.gpsOnCampus) {
      if (this.gpsDotEl) {
        this.gpsDotEl.className = 'gps-dot';
        this.gpsDotEl.style.boxShadow = '0 0 8px var(--neon-green)';
      }
      if (this.gpsStatusTextEl) {
        this.gpsStatusTextEl.textContent = 'ON CAMPUS (SAFE)';
        this.gpsStatusTextEl.style.color = 'var(--neon-green)';
      }
    } else {
      if (this.gpsDotEl) {
        this.gpsDotEl.className = 'gps-dot off';
        this.gpsDotEl.style.boxShadow = '0 0 8px var(--neon-pink)';
      }
      if (this.gpsStatusTextEl) {
        this.gpsStatusTextEl.textContent = 'OFF CAMPUS (BLOCKED)';
        this.gpsStatusTextEl.style.color = 'var(--neon-pink)';
      }
    }

    // Refresh QR code (disable if off campus)
    this.updateQRCode();
  }

  // Secure rotating QR Code token generation
  startQRRotation() {
    this.qrRotationTimer = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        this.secondsLeft = 10;
        this.updateQRCode();
      }
      if (this.qrTimerTextEl) {
        this.qrTimerTextEl.textContent = `Expires in: ${this.secondsLeft}s`;
      }
    }, 1000);
  }

  updateQRCode() {
    if (!this.currentStudent) return;

    if (!this.gpsOnCampus) {
      // Show blocked state
      if (this.qrImageEl) {
        this.qrImageEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ACCESS_DENIED_GEOFENCE_VIOLATION&color=ff0844';
      }
      this.otpToken = '';
      return;
    }

    // Generate simulated TOTP token
    const randToken = Math.floor(100000 + Math.random() * 900000);
    this.otpToken = String(randToken);

    // Payload for secure check-in
    const payload = {
  college: "SCET Nagpur",
  studentId: this.currentStudent.id,
  studentName: this.currentStudent.name,
  timestamp: Date.now(),
  otp: this.otpToken,
  geofenced: true
};

    const payloadString = JSON.stringify(payload);
    
    // Fetch QR Code from open server
    if (this.qrImageEl) {
      this.qrImageEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payloadString)}&color=0d0e15`;
    }

    if (this.onQRUpdated) {
      this.onQRUpdated(this.currentStudent.id, payload);
    }
  }

  // Clean timers
  destroy() {
    if (this.qrRotationTimer) {
      clearInterval(this.qrRotationTimer);
      this.qrRotationTimer = null;
    }
  }
}

// Instantiate and expose globally
const mobileSim = new StudentMobileSimulator();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mobileSim;
} else {
  window.mobileSim = mobileSim;
}
