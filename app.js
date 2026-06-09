// app.js
// Main UI Controller & Application Orchestrator

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize elements and modules
  let myChart = null;
  let isLoggedIn = false;
  const landingPage = document.getElementById('landing-page');
  const appContainer = document.getElementById('app-container');
  const getStartedBtn = document.getElementById('get-started-btn');
  const landingLoginBtn = document.getElementById('landing-login-btn');
  const landingUsername = document.getElementById('landing-username');
  const landingPassword = document.getElementById('landing-password');
  const loginModal = document.getElementById('login-modal');
  const loginBtn = document.getElementById('login-btn');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  
  // Default: show landing page, hide app
  landingPage.style.display = 'flex';
  appContainer.style.display = 'none';
  
  // Check if already logged in from localStorage
  const savedLogin = localStorage.getItem('techverseLoggedIn');
  if (savedLogin) {
    isLoggedIn = true;
    landingPage.style.display = 'none';
    appContainer.style.display = 'flex';
  }
  
  // Get Started button handler (in case we add it back later)
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      landingPage.style.display = 'none';
      appContainer.style.display = 'flex';
      // If not logged in, show login modal
      if (!savedLogin) {
        loginModal.classList.add('active');
      }
    });
  }
  
  // Landing page login button handler
  if (landingLoginBtn) {
    landingLoginBtn.addEventListener('click', () => {
      const username = landingUsername.value.trim();
      const password = landingPassword.value.trim();
      
      // Get registered users
      let users = JSON.parse(localStorage.getItem('techverseUsers') || '[{"username":"admin","password":"admin123","name":"Admin"}]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        isLoggedIn = true;
        localStorage.setItem('techverseLoggedIn', 'true');
        localStorage.setItem('techverseCurrentUser', JSON.stringify(user));
        landingPage.style.display = 'none';
        appContainer.style.display = 'flex';
        showToast(`Welcome ${user.name}!`, 'success');
      } else {
        showToast('Invalid credentials!', 'error');
      }
    });
  }
  
  // Also allow Enter key on landing password field
  if (landingPassword) {
    landingPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        landingLoginBtn.click();
      }
    });
  }
  
  // Registration toggle button handler
  const registerToggle = document.getElementById('landing-register-toggle');
  const registerModal = document.getElementById('register-modal');
  const registerCloseBtn = document.getElementById('register-close-btn');
  const regCancelBtn = document.getElementById('reg-cancel-btn');
  const regSaveBtn = document.getElementById('reg-save-btn');
  
  console.log('registerToggle element:', registerToggle);
  console.log('registerModal element:', registerModal);
  
  if (registerToggle) {
    registerToggle.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Registration button clicked!');
      alert('Registration button clicked!');
      console.log('registerModal:', registerModal);
      registerModal.classList.add('active');
      console.log('Modal classes after add:', registerModal.classList);
      console.log('Modal display:', getComputedStyle(registerModal).display);
      console.log('Modal opacity:', getComputedStyle(registerModal).opacity);
    });
  }
  
  if (registerCloseBtn) {
    registerCloseBtn.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }
  
  if (regCancelBtn) {
    regCancelBtn.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }
  
  if (regSaveBtn) {
    regSaveBtn.addEventListener('click', () => {
      const regName = document.getElementById('reg-name').value.trim();
      const regUsername = document.getElementById('reg-username').value.trim();
      const regPassword = document.getElementById('reg-password').value;
      const regConfirm = document.getElementById('reg-confirm').value;
      
      if (!regName || !regUsername || !regPassword) {
        showToast('All fields are required!', 'error');
        return;
      }
      
      if (regPassword !== regConfirm) {
        showToast('Passwords do not match!', 'error');
        return;
      }
      
      // Check if username already exists
      let users = JSON.parse(localStorage.getItem('techverseUsers') || '[{"username":"admin","password":"admin123","name":"Admin"}]');
      const userExists = users.some(u => u.username === regUsername);
      
      if (userExists) {
        showToast('Username already exists!', 'error');
        return;
      }
      
      users.push({username: regUsername, password: regPassword, name: regName});
      localStorage.setItem('techverseUsers', JSON.stringify(users));
      
      showToast('Account registered successfully! Please login.', 'success');
      registerModal.classList.remove('active');
      
      // Reset form
      document.getElementById('reg-name').value = '';
      document.getElementById('reg-username').value = '';
      document.getElementById('reg-password').value = '';
      document.getElementById('reg-confirm').value = '';
    });
  }
  
  // Login button click handler
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const username = loginUsername.value.trim();
      const password = loginPassword.value.trim();
      
      // Get registered users
      let users = JSON.parse(localStorage.getItem('techverseUsers') || '[{"username":"admin","password":"admin123","name":"Admin"}]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        isLoggedIn = true;
        localStorage.setItem('techverseLoggedIn', 'true');
        localStorage.setItem('techverseCurrentUser', JSON.stringify(user));
        loginModal.classList.remove('active');
        showToast(`Welcome ${user.name}!`, 'success');
      } else {
        showToast('Invalid credentials!', 'error');
      }
    });
  }
  
  // Also allow Enter key to login
  if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });
  }
  
  // Logout button click handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      isLoggedIn = false;
      localStorage.removeItem('techverseLoggedIn');
      loginModal.classList.remove('active'); // Hide login modal
      appContainer.style.display = 'none'; // Hide app
      landingPage.style.display = 'flex'; // Show landing page
      loginUsername.value = '';
      loginPassword.value = '';
      showToast('Logged out successfully!', 'info');
    });
  }
  
  // Add a clear all storage function (you can also call this from browser dev tools!)
  window.clearAllStorage = async function() {
    // Clear localStorage
    localStorage.clear();
    
    // Clear IndexedDB
    const dbNames = await indexedDB.databases();
    for (const dbInfo of dbNames) {
      await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(dbInfo.name);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    }
    
    showToast('All storage cleared! Reloading page...', 'success');
    setTimeout(() => {
      location.reload();
    }, 1500);
  };
  
  // Clear storage button listener
  const clearStorageBtn = document.getElementById('clear-storage-btn');
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', () => {
      playBeep('click');
      if (confirm('Are you sure you want to clear all storage? This will reset the app.')) {
        window.clearAllStorage();
      }
    });
  }

  // Initialize Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') {
      icon = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'error') {
      icon = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    } else {
      icon = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-4a1 1 0 10-2 0v4z" clip-rule="evenodd"/></svg>`;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Synthesize UI Alert Sounds (Offline Web Audio API)
  function playBeep(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High-tech rising double chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'alarm') {
        // Harsh low frequency buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140.00, ctx.currentTime); // F3
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'click') {
        // Small click sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch (e) {
      console.warn('Web Audio playback failed:', e);
    }
  }

  // Database Seeding and Initialization
  showToast('Initializing secure local database...', 'info');
  try {
    await window.db.init();
    showToast('Database initialized successfully.', 'success');
  } catch (err) {
    showToast('Database error, failed to load data.', 'error');
    console.error(err);
    return;
  }

  // Load registered faces into memory
  let studentsList = await window.db.getStudents();
  window.faceEngine.updateFaceMatcher(studentsList);

  // Train AI ML model on IndexedDB records
  showToast('AI Predictor: Fitting Multiple Regression coefficients...', 'info');
  await window.mlPredictor.trainModel(window.db);
  showToast('AI Predictor: Model optimized and active.', 'success');

  // Load components
  await initDashboard();
  await initStudentRoster();
  initMobileSimulator();
  initReports();
  initFaceKiosk();

  // Navigation Logic
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      playBeep('click');
      const targetPanelId = item.getAttribute('data-tab');
      
      // Update active nav link
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Update active tab panel
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(targetPanelId).classList.add('active');

      // Camera lifecycle management: Stop camera if user leaves Kiosk page
      if (targetPanelId !== 'kiosk-tab') {
        window.faceEngine.stopCamera();
        const viewport = document.getElementById('camera-viewport');
        if (viewport) {
          viewport.classList.remove('scanning');
        }
        const placeholder = document.getElementById('camera-placeholder');
        if (placeholder) {
          placeholder.style.display = 'flex';
        }
      }

      // Refresh view-specific lists
      if (targetPanelId === 'dashboard-tab') {
        refreshDashboardStats();
      } else if (targetPanelId === 'students-tab') {
        renderStudentCards();
      } else if (targetPanelId === 'predictor-tab') {
        runAIPrediction();
      }
    });
  });

  // Clock Widget
  setInterval(() => {
    const clock = document.getElementById('clock-widget-time');
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);

  // --- 1. DASHBOARD INITIALIZER & METRICS ---

  async function initDashboard() {
    // Populate stats cards
    await refreshDashboardStats();

    // Chart.js Setup
    const ctx = document.getElementById('attendance-chart');
    if (ctx) {
      const chartCtx = ctx.getContext('2d');
      
      // Calculate 10-day labels and data from db logs
      const logs = await window.db.getAttendanceLogs();
      const uniqueDates = [...new Set(logs.map(l => l.date))].sort().slice(-10);
      
      const chartLabels = uniqueDates.map(d => {
        const parts = d.split('-');
        return `${parts[1]}/${parts[2]}`; // MM/DD
      });

      const totalStudents = studentsList.length;
      
      // Calculate rates per date
      const csData = [];
      const eeData = [];
      const meData = [];

      uniqueDates.forEach(dateStr => {
        const dayLogs = logs.filter(l => l.date === dateStr);
        
        // CS
        const csLogs = dayLogs.filter(l => l.department === 'CS');
        const csPresent = csLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
        csData.push(csLogs.length ? (csPresent / csLogs.length) * 100 : 85);

        // EE
        const eeLogs = dayLogs.filter(l => l.department === 'EE');
        const eePresent = eeLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
        eeData.push(eeLogs.length ? (eePresent / eeLogs.length) * 100 : 80);

        // ME
        const meLogs = dayLogs.filter(l => l.department === 'ME');
        const mePresent = meLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
        meData.push(meLogs.length ? (mePresent / meLogs.length) * 100 : 78);
      });

      myChart = new Chart(chartCtx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: 'Computer Science',
              data: csData,
              borderColor: '#00f2fe',
              backgroundColor: 'rgba(0, 242, 254, 0.05)',
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              shadowColor: 'rgba(0, 242, 254, 0.4)',
              shadowBlur: 10
            },
            {
              label: 'Electrical Eng',
              data: eeData,
              borderColor: '#05ffb0',
              backgroundColor: 'rgba(5, 255, 176, 0.05)',
              borderWidth: 3,
              tension: 0.35,
              fill: true
            },
            {
              label: 'Mechanical Eng',
              data: meData,
              borderColor: '#ff9100',
              backgroundColor: 'rgba(255, 145, 0, 0.05)',
              borderWidth: 3,
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#9ea4c1',
                font: { family: 'Outfit', size: 12 }
              }
            }
          },
          scales: {
            y: {
              min: 50,
              max: 100,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#9ea4c1',
                callback: (value) => `${value}%`
              }
            },
            x: {
              grid: { color: 'transparent' },
              ticks: { color: '#9ea4c1' }
            }
          }
        }
      });
    }

    // Chart Filters
    const chartBtns = document.querySelectorAll('.chart-btn');
    chartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chartBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playBeep('click');
        
        // Simulates range update
        const days = parseInt(btn.getAttribute('data-days'));
        showToast(`Chart updated to show last ${days} days statistics.`, 'info');
      });
    });

    // Seed Sync Logs Console display
    const syncLogs = await window.db.getSyncLogs(15);
    const terminal = document.getElementById('terminal-logs');
    if (terminal) {
      terminal.innerHTML = '';
      syncLogs.forEach(log => appendTerminalLog(log));
    }

    // Connect DB sync logger listener to console widget
    window.db.addSyncListener(log => {
      // Toggle cloud dot animation
      const cloudDot = document.getElementById('cloud-status-dot');
      const cloudText = document.getElementById('cloud-status-text');
      if (cloudDot) {
        cloudDot.className = 'cloud-dot syncing';
        if (cloudText) cloudText.textContent = 'SYNCING LEDGER';
        setTimeout(() => {
          cloudDot.className = 'cloud-dot';
          if (cloudText) cloudText.textContent = 'CLOUD DB SYNCED';
        }, 1200);
      }
      appendTerminalLog(log);
    });
  }

  async function refreshDashboardStats() {
    const students = await window.db.getStudents();
    const logs = await window.db.getAttendanceLogs();
    const spoofLogs = await window.db.getSpoofLogs();

    // 1. Count male and female students
    const maleCount = students.filter(s => s.gender === 'Male').length;
    const femaleCount = students.filter(s => s.gender === 'Female').length;

    // 2. Attendance Rate
    // Count rate of last recorded school date
    const uniqueDates = [...new Set(logs.map(l => l.date))].sort();
    const latestDate = uniqueDates[uniqueDates.length - 1];
    
    let attendanceRate = 88.4;
    let lateRate = 8.5;
    
    if (latestDate) {
      const todayLogs = logs.filter(l => l.date === latestDate);
      const totalRegistered = students.length;
      
      const presentCount = todayLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
      attendanceRate = (presentCount / totalRegistered) * 100;

      const lateCount = todayLogs.filter(l => l.status === 'Late').length;
      lateRate = presentCount > 0 ? (lateCount / presentCount) * 100 : 0;
    }

    document.getElementById('stat-rate').textContent = `${attendanceRate.toFixed(1)}%`;
    document.getElementById('stat-students').textContent = students.length;
    document.getElementById('stat-male').textContent = maleCount;
    document.getElementById('stat-female').textContent = femaleCount;
    document.getElementById('stat-late').textContent = `${lateRate.toFixed(1)}%`;
    document.getElementById('stat-spoofs').textContent = spoofLogs.length;

    // Render Recent logs
    const recentLogsList = document.getElementById('recent-logs');
    if (recentLogsList) {
      recentLogsList.innerHTML = '';
      // Fetch latest 6 logs that were Present/Late (from today)
      const scanLogs = logs.filter(l => l.status !== 'Absent').reverse().slice(0, 6);
      
      scanLogs.forEach(log => {
        const student = students.find(s => s.id === log.studentId);
        const avatar = student ? student.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.studentId}`;
        
        const badgeClass = log.status === 'Present' ? 'badge-present' : 'badge-late';
        
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerHTML = `
          <img src="${avatar}" class="log-avatar" alt="Avatar">
          <div class="log-details">
            <div class="log-name-row">
              <span class="log-name">${log.studentName}</span>
              <span class="log-time">${log.time}</span>
            </div>
            <div class="log-dept-row">
              <span class="log-dept">${log.studentId}</span>
              <span class="badge ${badgeClass}">${log.status}</span>
            </div>
          </div>
        `;
        recentLogsList.appendChild(item);
      });
    }

    // Render Spoof Alerts
    const alertList = document.getElementById('alert-list');
    if (alertList) {
      alertList.innerHTML = '';
      const recentSpoofs = [...spoofLogs].reverse().slice(0, 5);
      
      if (recentSpoofs.length === 0) {
        alertList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">No security alerts recorded. Liveness active.</div>';
      } else {
        recentSpoofs.forEach(log => {
          const item = document.createElement('div');
          item.className = 'alert-item';
          item.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            <div class="alert-info">
              <h4>PROXY DETECTED: BLOCKED</h4>
              <p>${log.studentName} (${log.studentId})</p>
              <p style="color:var(--neon-pink);font-size:11px;margin-top:2px;">Type: ${log.details}</p>
              <div class="alert-meta">
                <span>LIVENESS: ${log.livenessScore}</span>
                <span>${log.date} ${log.time}</span>
              </div>
            </div>
          `;
          alertList.appendChild(item);
        });
      }
    }

    // Render Department progress rows
    const deptRows = document.getElementById('dept-attendance-rows');
    if (deptRows) {
      deptRows.innerHTML = '';
      
      // Calculate dept averages
      const depts = {};
      window.DEPARTMENTS.forEach(d => {
        depts[d.id] = { name: d.name, present: 0, total: 0 };
      });

      logs.forEach(log => {
        if (depts[log.department]) {
          depts[log.department].total++;
          if (log.status === 'Present' || log.status === 'Late') {
            depts[log.department].present++;
          }
        }
      });

      Object.keys(depts).forEach(id => {
        const d = depts[id];
        const pct = d.total > 0 ? (d.present / d.total) * 100 : 84.5;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${id}</strong></td>
          <td>${d.name}</td>
          <td>
            <div class="dept-progress">
              <div class="dept-progress-bar" style="width: ${pct}%"></div>
            </div>
            <span>${pct.toFixed(1)}%</span>
          </td>
        `;
        deptRows.appendChild(tr);
      });
    }
  }

  function appendTerminalLog(log) {
    const terminal = document.getElementById('terminal-logs');
    if (!terminal) return;

    const line = document.createElement('div');
    line.className = 'term-line';
    
    const time = new Date(log.timestamp).toLocaleTimeString();
    const isError = log.status === 'CRITICAL';
    const tag = isError ? '[SECURITY_ALERT]' : `[${log.type}]`;
    const tagClass = isError ? 'term-tag err' : 'term-tag';

    line.innerHTML = `&gt; <span class="term-time" style="color:var(--text-muted);margin-right:6px;">${time}</span><span class="${tagClass}">${tag}</span> ${log.details}`;
    
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
  }

  // --- 2. FACE SMART KIOSK RENDER & WEBCAM INTERFACE ---

  function initFaceKiosk() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const startCamBtn = document.getElementById('start-camera-btn');
    const stopCamBtn = document.getElementById('stop-camera-btn');
    const viewport = document.getElementById('camera-viewport');
    const placeholder = document.getElementById('camera-placeholder');

    const enrollVideo = document.getElementById('wizard-video');
    const enrollOverlayOval = document.getElementById('wizard-overlay-oval');

    // Start Camera Kiosk
    if (startCamBtn) {
      startCamBtn.addEventListener('click', async () => {
        playBeep('click');
        try {
          showToast('Starting high-definition face camera...', 'info');
          placeholder.style.display = 'none';
          viewport.classList.add('scanning');
          
          // Load neural weights first
          if (!window.faceEngine.modelsLoaded) {
            showToast('Loading Face Neural Networks (TinyFace + Landmarks + Recognition)...', 'info');
            await window.faceEngine.loadModels();
            showToast('Neural models loaded successfully.', 'success');
          }

          // Fetch student profiles from DB to bind matching weights
          const students = await window.db.getStudents();
          window.faceEngine.updateFaceMatcher(students);

          await window.faceEngine.startCamera(video, canvas);
          showToast('Kiosk scan active. Standing by for liveness challenge.', 'success');
        } catch (e) {
          showToast('Could not access camera. Check device permissions.', 'error');
          placeholder.style.display = 'flex';
          viewport.classList.remove('scanning');
        }
      });
    }

    // Stop Camera Kiosk
    if (stopCamBtn) {
      stopCamBtn.addEventListener('click', () => {
        playBeep('click');
        window.faceEngine.stopCamera();
        placeholder.style.display = 'flex';
        viewport.classList.remove('scanning');
        showToast('Kiosk offline.', 'info');
      });
    }

    // Hook liveness hooks
    window.faceEngine.onStatusChange = (status) => {
      const liveStatusVal = document.getElementById('live-status-val');
      const challengeVal = document.getElementById('challenge-prompt');
      const progressFill = document.getElementById('challenge-progress-fill');
      
      if (status === 'CAMERA_ACTIVE') {
        if (liveStatusVal) liveStatusVal.textContent = 'WAITING FOR FACE';
      }
    };

    // Frame loops will call update. To map visual logs:
    setInterval(() => {
      const engine = window.faceEngine;
      const liveStatusVal = document.getElementById('live-status-val');
      const livenessScoreVal = document.getElementById('liveness-score-val');
      const challengeVal = document.getElementById('challenge-prompt');
      const progressFill = document.getElementById('challenge-progress-fill');

      if (!engine.stream) return;

      // Update text details
      if (liveStatusVal) {
        liveStatusVal.textContent = engine.livenessStatus;
        liveStatusVal.className = 'sm-value';
        if (engine.livenessStatus === 'PASSED') liveStatusVal.classList.add('safe');
        if (engine.livenessStatus === 'FAILED') liveStatusVal.classList.add('danger');
      }

      // Calculate EAR and movement thresholds mock outputs for details card
      if (livenessScoreVal) {
        let pct = '0.0%';
        if (engine.livenessStatus === 'CHALLENGING') {
          // Fluctuating liveness based on landmarks
          pct = (60 + Math.random() * 38).toFixed(1) + '%';
        } else if (engine.livenessStatus === 'PASSED') {
          pct = (94 + Math.random() * 5).toFixed(1) + '%';
        } else if (engine.livenessStatus === 'FAILED') {
          pct = (12 + Math.random() * 15).toFixed(1) + '%';
        }
        livenessScoreVal.textContent = pct;
      }

      // Challenge prompts rendering
      if (challengeVal) {
        if (engine.livenessStatus === 'CHALLENGING') {
          const current = engine.challengeQueue[engine.currentChallengeIndex];
          let promptStr = '';
          if (current === 'BLINK') promptStr = 'ACTIVATE: Blink eyes 1 time';
          else if (current === 'TURN_LEFT') promptStr = 'ACTIVATE: Turn head far LEFT';
          else if (current === 'TURN_RIGHT') promptStr = 'ACTIVATE: Turn head far RIGHT';
          else if (current === 'SMILE') promptStr = 'ACTIVATE: Smile widely';
          
          challengeVal.textContent = promptStr;
          challengeVal.className = 'challenge-prompt active-prompt';
        } else if (engine.livenessStatus === 'PASSED') {
          challengeVal.textContent = 'LIVENESS VERIFIED ✔';
          challengeVal.className = 'challenge-prompt';
          if (challengeVal.style) challengeVal.style.color = 'var(--neon-green)';
        } else if (engine.livenessStatus === 'FAILED') {
          challengeVal.textContent = '⚠️ SECURITY REJECTED: PHOTO SPOOF DETECTED';
          challengeVal.className = 'challenge-prompt';
          if (challengeVal.style) challengeVal.style.color = 'var(--neon-pink)';
        } else {
          challengeVal.textContent = 'STANDING BY FOR CHALLENGE';
          challengeVal.className = 'challenge-prompt';
          challengeVal.removeAttribute('style');
        }
      }

      // Progress bar fill
      if (progressFill) {
        if (engine.livenessStatus === 'CHALLENGING') {
          progressFill.style.width = `${engine.challengeProgress}%`;
        } else {
          progressFill.style.width = '0%';
        }
      }
    }, 150);

    // Kiosk verification handlers
    window.faceEngine.onLivenessPassed = async (studentId, descriptor) => {
      playBeep('success');
      
      const successModal = document.getElementById('success-modal');
      const avatarEl = document.getElementById('swipe-avatar');
      const nameEl = document.getElementById('swipe-name');
      const idEl = document.getElementById('swipe-id');
      const statusBadge = document.getElementById('swipe-badge');
      
      // Determine if student is registered or guest
      if (studentId && studentId !== 'Guest/Unregistered') {
        const student = studentsList.find(s => s.id === studentId);
        
        if (student) {
          // Mark attendance log in DB
          // Check if late (starts at 8:00 AM)
          const now = new Date();
          const limitTime = new Date();
          limitTime.setHours(8, 0, 0); // 8:00 AM limit
          
          const status = now > limitTime ? 'Late' : 'Present';
          const livenessScore = (94 + Math.random() * 5).toFixed(1) + '%';
          
          const log = await window.db.recordAttendance(studentId, status, livenessScore);
          
          // Populate success card overlay
          if (avatarEl) avatarEl.src = student.avatar;
          if (nameEl) nameEl.textContent = student.name;
          if (idEl) idEl.textContent = student.id;
          if (statusBadge) {
            statusBadge.textContent = status;
            statusBadge.className = status === 'Present' ? 'badge badge-present' : 'badge badge-late';
          }
          
          // Display Success overlay
          if (successModal) successModal.classList.add('active');
          showToast(`Attendance marked for ${student.name} (${status}).`, 'success');
        }
      } else {
        // Unrecognized guest face
        if (avatarEl) avatarEl.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=unregistered';
        if (nameEl) nameEl.textContent = 'Guest Visitor';
        if (idEl) idEl.textContent = 'Face Unregistered';
        if (statusBadge) {
          statusBadge.textContent = 'VERIFIED';
          statusBadge.className = 'badge badge-present';
        }
        if (successModal) successModal.classList.add('active');
        showToast('Guest liveness verification succeeded. Visitor logged.', 'info');
      }

      // Hide modal after 3 seconds and reset kiosk to wait for next person
      setTimeout(() => {
        if (successModal) successModal.classList.remove('active');
        
        // Clear secure QR code override
        window.faceEngine.simulateQRCodeMatch = null;
        
        window.faceEngine.resetLiveness();
      }, 3000);
    };

    window.faceEngine.onLivenessFailed = async (studentId, reason) => {
      playBeep('alarm');
      
      // Flash red alert screen on camera viewport
      if (viewport) {
        viewport.classList.add('alarm-active');
        setTimeout(() => viewport.classList.remove('alarm-active'), 1200);
      }

      // Record security log in db
      const score = (12 + Math.random() * 15).toFixed(1) + '%';
      await window.db.recordSpoofAttempt(studentId !== 'Guest/Unregistered' ? studentId : null, score, reason);
      
      showToast(`⚠️ SECURITY ALARM: ${reason}`, 'error');

      // Reset kiosk after 3.5 seconds
      setTimeout(() => {
        window.faceEngine.simulateQRCodeMatch = null;
        window.faceEngine.resetLiveness();
      }, 3500);
    };

    // Exhibition Quick Demo buttons
    const demoSpoofBtn = document.getElementById('demo-spoof-btn');
    const demoQrBtn = document.getElementById('demo-qr-btn');

    if (demoSpoofBtn) {
      demoSpoofBtn.addEventListener('click', () => {
        playBeep('click');
        window.faceEngine.simulateSpoofActive = !window.faceEngine.simulateSpoofActive;
        
        if (window.faceEngine.simulateSpoofActive) {
          demoSpoofBtn.textContent = 'Disable Spoof Injection';
          demoSpoofBtn.style.background = 'rgba(255, 8, 68, 0.2)';
          demoSpoofBtn.style.borderColor = 'var(--neon-pink)';
          showToast('Anti-Spoofing Demo: Injected 2D Photo printout stream.', 'warning');
        } else {
          demoSpoofBtn.textContent = 'Inject Photo Spoof';
          demoSpoofBtn.style.background = 'rgba(255,255,255,0.03)';
          demoSpoofBtn.style.borderColor = 'var(--panel-border)';
          showToast('Anti-Spoofing Demo: Restored normal live feed.', 'info');
        }
      });
    }

    if (demoQrBtn) {
      demoQrBtn.addEventListener('click', () => {
        playBeep('click');
        
        const mStudentId = window.mobileSim.currentStudent ? window.mobileSim.currentStudent.id : null;
        if (!mStudentId) {
          showToast('Load a student in the Mobile Simulator first.', 'error');
          return;
        }

        if (!window.mobileSim.gpsOnCampus) {
          showToast('Geofence Violation: Student QR is invalid (off-campus). Scan rejected.', 'error');
          return;
        }

        // Set QR matching ID override
        window.faceEngine.simulateQRCodeMatch = mStudentId;
        showToast(`Secure QR Scanned for ${window.mobileSim.currentStudent.name}! Face liveness check starting.`, 'success');
      });
    }
  }

  // --- 3. STUDENTS ROSTER & WIZARD FACE REGISTER ENROLL ---

  async function initStudentRoster() {
    // Render roster cards
    renderStudentCards();

    // Roster Search
    const searchInput = document.getElementById('student-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.student-card');
        
        cards.forEach(card => {
          const name = card.getAttribute('data-name');
          const id = card.getAttribute('data-id');
          if (name.includes(query) || id.includes(query)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }

    // Modal triggers
    const enrollOpenBtn = document.getElementById('enroll-student-btn');
    const enrollCloseBtn = document.getElementById('enroll-close-btn');
    const modal = document.getElementById('enroll-modal');

    if (enrollOpenBtn) {
      enrollOpenBtn.addEventListener('click', () => {
        playBeep('click');
        if (modal) modal.classList.add('active');
        initEnrollmentWizard();
      });
    }

    if (enrollCloseBtn) {
      enrollCloseBtn.addEventListener('click', () => {
        playBeep('click');
        closeEnrollmentWizard();
      });
    }

    // Edit Modal Triggers
    const editCloseBtn = document.getElementById('edit-close-btn');
    const editCancelBtn = document.getElementById('e-cancel-btn');
    const editSaveBtn = document.getElementById('e-save-btn');
    const editModal = document.getElementById('edit-modal');

    if (editCloseBtn) {
      editCloseBtn.addEventListener('click', () => {
        playBeep('click');
        closeEditModal();
      });
    }

    if (editCancelBtn) {
      editCancelBtn.addEventListener('click', () => {
        playBeep('click');
        closeEditModal();
      });
    }

    if (editSaveBtn) {
      editSaveBtn.addEventListener('click', async () => {
        playBeep('click');
        if (!editingStudentId) return;
        
        const updatedName = document.getElementById('e-name').value.trim();
        const updatedEmail = document.getElementById('e-email').value.trim();
        const updatedDept = document.getElementById('e-dept').value;
        const updatedGender = document.getElementById('e-gender').value;

        if (!updatedName) {
          showToast('Student name is required.', 'error');
          return;
        }
        
        // Check for duplicate email (but not current student's own email)
        const allStudents = await window.db.getStudents();
        const duplicateEmail = allStudents.some(s => s.email === updatedEmail && s.id !== editingStudentId);
        
        if (duplicateEmail) {
          showToast(`Email ${updatedEmail} already exists!`, 'error');
          return;
        }

        // Get current student from DB
        const student = await window.db.getStudentById(editingStudentId);
        if (student) {
          // Update fields
          student.name = updatedName;
          student.email = updatedEmail;
          student.department = updatedDept;
          student.gender = updatedGender;
          // Update avatar to match new name
          student.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(updatedName)}`;

          // Save to DB
          await window.db.saveStudent(student);
          showToast('Student details updated successfully!', 'success');
          
          // Refresh UI
          studentsList = await window.db.getStudents();
          renderStudentCards();
          refreshDashboardStats();
          
          // Update face matcher and mobile selector
          window.faceEngine.updateFaceMatcher(studentsList);
          window.mobileSim.populateStudentSelector(studentsList);

          closeEditModal();
        }
      });
    }
  }

  // Variable to track which student we're editing
  let editingStudentId = null;

  // Helper function to open edit modal
  function openEditModal(student) {
    editingStudentId = student.id;
    document.getElementById('e-name').value = student.name;
    document.getElementById('e-email').value = student.email;
    document.getElementById('e-id').value = student.id;
    document.getElementById('e-dept').value = student.department;
    document.getElementById('e-gender').value = student.gender || 'Male';
    document.getElementById('edit-modal').classList.add('active');
  }

  // Helper function to close edit modal
  function closeEditModal() {
    editingStudentId = null;
    document.getElementById('edit-modal').classList.remove('active');
  }

  async function renderStudentCards() {
    const rosterGrid = document.getElementById('roster-grid');
    if (!rosterGrid) return;
    
    rosterGrid.innerHTML = '';
    const students = await window.db.getStudents();
    
    // Sort CS-001, CS-002, etc.
    students.sort((a, b) => a.id.localeCompare(b.id));

    students.forEach(student => {
      const card = document.createElement('div');
      card.className = 'glass-card student-card';
      card.setAttribute('data-name', student.name.toLowerCase());
      card.setAttribute('data-id', student.id.toLowerCase());
      
      const dot = student.faceRegistered ? 'dot-green' : 'dot-red';
      const text = student.faceRegistered ? 'Biometrics Active' : 'No Face Registry';

      card.innerHTML = `
        <img src="${student.avatar}" class="student-card-avatar" alt="Student photo">
        <div class="student-card-name">${student.name}</div>
        <div class="student-card-id">${student.id}</div>
        <div class="student-card-dept">${student.department} | ${student.gender || 'N/A'}</div>
        <div class="face-status">
          <span class="${dot}"></span>
          <span>${text}</span>
        </div>
        <button class="btn-secondary" style="margin-top:10px; padding:8px 16px; font-size:12px;">Edit Details</button>
      `;
      
      // Add edit button click listener
      const editBtn = card.querySelector('button');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playBeep('click');
        openEditModal(student);
      });

      rosterGrid.appendChild(card);
    });
  }

  // ENROLLMENT STEP-BY-STEP FACE REGISTER WIZARD
  let wizardStep = 1;
  let wizardStream = null;
  let wizardFaceDescriptor = null;
  let wizardCapturedPhoto = null;

  // Helper function to get next student number for a specific department
  function getNextStudentId(department) {
    // Filter students by department
    const deptStudents = studentsList.filter(s => s.department === department);
    // Extract numbers from existing IDs (e.g., "CS-2026-001" or "CS-2026-50" → 1 or 50)
    const existingNumbers = deptStudents.map(s => {
      const parts = s.id.split('-');
      return parseInt(parts[2], 10) || 0;
    });
    // Find max number and add 1
    const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${department}-2026-${nextNum}`; // No leading zeros
  }

  function initEnrollmentWizard() {
    wizardStep = 1;
    wizardFaceDescriptor = null;
    updateWizardUI();

    // Reset inputs
    document.getElementById('w-name').value = '';
    document.getElementById('w-email').value = '';
    const defaultDept = document.getElementById('w-dept').value;
    
    // Auto-generate numeric ID based on selected department
    document.getElementById('w-id').value = getNextStudentId(defaultDept);

    // Listen to department dropdown changes to update student ID
    const wDept = document.getElementById('w-dept');
    if (wDept) {
      wDept.addEventListener('change', (e) => {
        const newDept = e.target.value;
        document.getElementById('w-id').value = getNextStudentId(newDept);
      });
    }

    // Hook wizard navigation buttons
    const next1 = document.getElementById('w-next-1');
    const prev2 = document.getElementById('w-prev-2');
    const captureBtn = document.getElementById('w-capture-btn');
    const cancel3 = document.getElementById('w-cancel-3');
    const finishBtn = document.getElementById('w-finish-btn');

    next1.onclick = () => {
      playBeep('click');
      const name = document.getElementById('w-name').value.trim();
      const email = document.getElementById('w-email').value.trim();
      if (!name || !email) {
        showToast('Please fill out name and email.', 'error');
        return;
      }
      wizardStep = 2;
      updateWizardUI();
      startWizardCamera();
    };

    prev2.onclick = () => {
      playBeep('click');
      stopWizardCamera();
      wizardStep = 1;
      updateWizardUI();
    };

    cancel3.onclick = () => {
      playBeep('click');
      closeEnrollmentWizard();
    };
  }

  async function startWizardCamera() {
    const video = document.getElementById('wizard-video');
    const oval = document.getElementById('wizard-overlay-oval');
    const capturesCounter = document.getElementById('captures-counter');

    if (capturesCounter) capturesCounter.textContent = 'Align face inside frame and stand still';
    if (oval) oval.className = 'wizard-overlay-oval';

    try {
      wizardStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: 'user' }
      });
      video.srcObject = wizardStream;
      video.play();

      // Hook Capture Face button
      const captureBtn = document.getElementById('w-capture-btn');
      captureBtn.onclick = async () => {
        playBeep('click');
        if (capturesCounter) capturesCounter.textContent = 'Extracting biometric patterns...';
        
        // Wait models load
        if (!window.faceEngine.modelsLoaded) {
          await window.faceEngine.loadModels();
        }

        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 });
        const detection = await faceapi.detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Biometric vector extracted!
              wizardFaceDescriptor = detection.descriptor;
          
          // Capture the photo from the video
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          wizardCapturedPhoto = canvas.toDataURL('image/png');
          
          if (oval) oval.className = 'wizard-overlay-oval verified';
          if (capturesCounter) capturesCounter.textContent = 'Biometric mapping successful!';
          playBeep('success');
          
          setTimeout(() => {
            stopWizardCamera();
            wizardStep = 3;
            updateWizardUI();
            
            // Render details summary on final step
            const name = document.getElementById('w-name').value.trim();
            const id = document.getElementById('w-id').value.trim();
            document.getElementById('w-summary-name').textContent = name;
            document.getElementById('w-summary-id').textContent = id;
            
            // Show captured photo in summary step
            const summaryPhoto = document.getElementById('w-summary-photo');
            if (summaryPhoto && wizardCapturedPhoto) {
              summaryPhoto.src = wizardCapturedPhoto;
            }
          }, 1000);
        } else {
          // Face not detected properly
          if (capturesCounter) capturesCounter.textContent = '❌ Face not detected. Align within oval.';
          playBeep('alarm');
        }
      };

    } catch (e) {
      showToast('Could not start webcam for biometrics.', 'error');
    }
  }

  function stopWizardCamera() {
    if (wizardStream) {
      wizardStream.getTracks().forEach(track => track.stop());
      wizardStream = null;
    }
    const video = document.getElementById('wizard-video');
    if (video) video.srcObject = null;
  }

  function closeEnrollmentWizard() {
    stopWizardCamera();
    wizardStep = 1;
    wizardFaceDescriptor = null;
    wizardCapturedPhoto = null;
    const modal = document.getElementById('enroll-modal');
    if (modal) modal.classList.remove('active');
  }

  function updateWizardUI() {
    // Toggle active header steps
    document.querySelectorAll('.wizard-step').forEach((el, index) => {
      if (index + 1 === wizardStep) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Toggle panel contents
    document.querySelectorAll('.wizard-content').forEach((el, index) => {
      if (index + 1 === wizardStep) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Handle Finish Button
    const finishBtn = document.getElementById('w-finish-btn');
    if (finishBtn) {
      finishBtn.onclick = async () => {
        playBeep('click');
        const name = document.getElementById('w-name').value.trim();
        const id = document.getElementById('w-id').value.trim();
        const email = document.getElementById('w-email').value.trim();
        const dept = document.getElementById('w-dept').value;
        const gender = document.getElementById('w-gender').value;

        // Validate biometrics are captured
        if (!wizardFaceDescriptor) {
          showToast('Please capture biometrics first!', 'error');
          return;
        }

        // Check for duplicate student ID or email
        const existingStudents = await window.db.getStudents();
        const duplicateId = existingStudents.some(s => s.id === id);
        const duplicateEmail = existingStudents.some(s => s.email === email);
        
        if (duplicateId) {
          showToast(`Student ID ${id} already exists!`, 'error');
          return;
        }
        
        if (duplicateEmail) {
          showToast(`Email ${email} already exists!`, 'error');
          return;
        }

        const newStudent = {
          id: id,
          name: name,
          gender: gender,
          department: dept,
          email: email,
          avatar: wizardCapturedPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          profile: 'average',
          faceRegistered: true,
          faceDescriptor: Array.from(wizardFaceDescriptor) // Save as standard Array in IndexedDB
        };

        try {
          await window.db.saveStudent(newStudent);
          showToast(`Student ${name} enrolled successfully.`, 'success');
          
          // Reload roster cards and list
          await renderStudentCards();
          
          // Re-populate dropdowns and update studentsList
          const students = await window.db.getStudents();
          studentsList = students;
          window.mobileSim.populateStudentSelector(students);
          window.faceEngine.updateFaceMatcher(students);

          // Refresh dashboard stats to update male/female counts
          await refreshDashboardStats();

          closeEnrollmentWizard();
        } catch (e) {
          showToast('Failed to save student profile.', 'error');
          console.error(e);
        }
      };
    }
  }

  // --- 4. AI ATTENDANCE PREDICTOR CONTROLS ---

  function initMobileSimulator() {
    // Populate mobile selector list
    window.mobileSim.populateStudentSelector(studentsList);
    
    // Bind mobile view simulator hooks
    window.mobileSim.init({
      studentSelect: document.getElementById('m-student-select'),
      avatar: document.getElementById('m-student-avatar'),
      name: document.getElementById('m-student-name'),
      id: document.getElementById('m-student-id'),
      qrImage: document.getElementById('m-qr-code-img'),
      qrTimerText: document.getElementById('m-qr-timer-text'),
      gpsDot: document.getElementById('m-gps-dot'),
      gpsStatusText: document.getElementById('m-gps-status'),
      gpsToggle: document.getElementById('m-gps-toggle-btn'),
      personalRate: document.getElementById('m-personal-rate'),
      personalChartRing: document.getElementById('m-personal-ring')
    });
  }

  // AI Predictor Tab logic
  const pDay = document.getElementById('p-day');
  const pWeather = document.getElementById('p-weather');
  const pTime = document.getElementById('p-time');
  const pExam = document.getElementById('p-exam');

  if (pDay && pWeather && pTime && pExam) {
    const triggerPredict = () => {
      runAIPrediction();
    };

    pDay.addEventListener('change', triggerPredict);
    pWeather.addEventListener('change', triggerPredict);
    pTime.addEventListener('change', triggerPredict);
    pExam.addEventListener('change', triggerPredict);

    // Initial run
    runAIPrediction();
  }

  function runAIPrediction() {
    const day = pDay.value;
    const weather = pWeather.value;
    const time = pTime.value;
    const isExam = pExam.checked;

    // Call ML predictor regression
    const rate = window.mlPredictor.predict(day, weather, time, isExam);
    const pctStr = (rate * 100).toFixed(1) + '%';
    
    const outputPercent = document.getElementById('pred-percent-val');
    const outputVerdict = document.getElementById('pred-verdict-val');
    const outputInsights = document.getElementById('pred-insights-list');

    if (outputPercent) {
      outputPercent.textContent = pctStr;
      outputPercent.style.background = 'linear-gradient(to right, #ffffff, var(--neon-cyan))';
      outputPercent.style.webkitBackgroundClip = 'text';
    }

    if (outputVerdict) {
      if (rate >= 0.85) {
        outputVerdict.textContent = 'VERDICT: SATISFACTORY PHYSICAL TURNOUT';
        outputVerdict.style.color = 'var(--neon-green)';
      } else if (rate >= 0.75) {
        outputVerdict.textContent = 'VERDICT: AVERAGE OUTLOOK - MONITOR CONDITIONS';
        outputVerdict.style.color = 'var(--neon-orange)';
      } else {
        outputVerdict.textContent = 'VERDICT: HIGH DROPOUT RISK PREDICTED';
        outputVerdict.style.color = 'var(--neon-pink)';
      }
    }

    // Generate insights and lists of recommendations
    const recs = window.mlPredictor.generateRecommendations(day, weather, time, isExam);
    if (outputInsights) {
      outputInsights.innerHTML = '';
      recs.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        outputInsights.appendChild(li);
      });
    }

    // Populate students at risk lists (< 75% average attendance historical)
    populateRiskAssessment(rate);
  }

  async function populateRiskAssessment(currentPredictedRate) {
    const container = document.getElementById('risk-students-list');
    if (!container) return;

    container.innerHTML = '';
    const students = await window.db.getStudents();
    const logs = await window.db.getAttendanceLogs();

    const riskList = [];
    students.forEach(student => {
      const studentLogs = logs.filter(l => l.studentId === student.id);
      if (studentLogs.length === 0) return;

      const attended = studentLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
      const rate = (attended / studentLogs.length) * 100;
      
      // If student is historically under 76% or if we predict high dropouts today for poor students
      if (rate < 76.0) {
        riskList.push({
          name: student.name,
          id: student.id,
          rate: rate.toFixed(1),
          profile: student.profile
        });
      }
    });

    if (riskList.length === 0) {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:13.5px;padding:10px;">Zero students identified under critical risk.</div>';
    } else {
      // Sort lowest first
      riskList.sort((a,b) => parseFloat(a.rate) - parseFloat(b.rate));
      
      riskList.forEach(student => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '8px 12px';
        item.style.background = 'rgba(255,255,255,0.01)';
        item.style.border = '1px solid var(--panel-border)';
        item.style.borderRadius = '8px';
        item.style.marginBottom = '6px';
        item.style.fontSize = '13.5px';

        item.innerHTML = `
          <div>
            <strong>${student.name}</strong> 
            <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px;margin-left:6px;">${student.id}</span>
          </div>
          <div style="color:var(--neon-pink);font-weight:600;">${student.rate}%</div>
        `;
        container.appendChild(item);
      });
    }
  }

  // --- 5. REPORT GENERATOR TRIGGERS ---

  function initReports() {
    const csvBtn = document.getElementById('report-export-csv');
    const pdfBtn = document.getElementById('report-export-pdf');
    const repDept = document.getElementById('r-dept');
    const repThreshold = document.getElementById('r-threshold');

    // Default dates (today and 30 days ago)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startInput = document.getElementById('r-start-date');
    const endInput = document.getElementById('r-end-date');

    if (startInput) startInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    if (endInput) endInput.value = today.toISOString().split('T')[0];

    const generateFilteredData = async () => {
      const filters = {
        startDate: startInput.value,
        endDate: endInput.value,
        department: repDept.value,
        threshold: repThreshold.value
      };

      const logs = await window.db.getAttendanceLogs();
      const students = await window.db.getStudents();
      const data = window.reportGenerator.filterLogs(logs, students, filters);
      return { data, filters };
    };

    if (csvBtn) {
      csvBtn.addEventListener('click', async () => {
        playBeep('click');
        const { data, filters } = await generateFilteredData();
        const dateRangeStr = `${filters.startDate}_to_${filters.endDate}`;
        window.reportGenerator.exportToCSV(data, dateRangeStr);
        showToast('CSV report compiled and downloaded.', 'success');
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', async () => {
        playBeep('click');
        const { data, filters } = await generateFilteredData();
        
        let deptName = 'All Departments';
        if (filters.department !== 'ALL') {
          const deptObj = window.DEPARTMENTS.find(d => d.id === filters.department);
          deptName = deptObj ? deptObj.name : filters.department;
        }

        window.reportGenerator.exportToPDF(data, filters, deptName);
        showToast('PDF report rendering inside separate print frame...', 'success');
      });
    }
  }
});
