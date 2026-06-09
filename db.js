// db.js
// IndexedDB Database Manager for the Smart Attendance System

class AttendanceDatabase {
  constructor() {
    this.dbName = 'SmartAttendanceDB';
    this.dbVersion = 2;
    this.db = null;
    this.syncCallbacks = [];
  }

  // Open Database
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        
        // Check if database needs initial seeding
        const studentCount = await this.getStudentCount();
        if (studentCount === 0) {
          console.log('Database empty. Seeding initial mock data...');
          await this.seedDatabase();
        }
        
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store 1: Students Roster
        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: 'id' });
          studentStore.createIndex('department', 'department', { unique: false });
          studentStore.createIndex('name', 'name', { unique: false });
        }

        // Store 2: Attendance Logs
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
          attendanceStore.createIndex('date', 'date', { unique: false });
          attendanceStore.createIndex('studentId', 'studentId', { unique: false });
          attendanceStore.createIndex('status', 'status', { unique: false });
          attendanceStore.createIndex('date_studentId', ['date', 'studentId'], { unique: true });
        }

        // Store 3: Spoof Alerts Logs
        if (!db.objectStoreNames.contains('spoof_logs')) {
          const spoofStore = db.createObjectStore('spoof_logs', { keyPath: 'id', autoIncrement: true });
          spoofStore.createIndex('date', 'date', { unique: false });
        }

        // Store 4: Synchronization logs
        if (!db.objectStoreNames.contains('sync_logs')) {
          db.createObjectStore('sync_logs', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Helper: Count students
  getStudentCount() {
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      const countRequest = store.count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => resolve(0);
    });
  }

  // Seed DB with mock data
  async seedDatabase() {
    // 1. Add students
    const studentTx = this.db.transaction(['students'], 'readwrite');
    const studentStore = studentTx.objectStore('students');
    
    // We get initial students from mock-data.js (which must load before db.js)
    const students = window.initialStudents || [];
    for (const student of students) {
      studentStore.add(student);
    }
    
    await new Promise((resolve) => {
      studentTx.oncomplete = resolve;
    });

    // 2. Generate 30 days of attendance logs
    const { logs, spoofingLogs } = window.generateMockAttendance(students);

    // 3. Add attendance logs in chunks/transactions
    const attendanceTx = this.db.transaction(['attendance'], 'readwrite');
    const attendanceStore = attendanceTx.objectStore('attendance');
    for (const log of logs) {
      attendanceStore.add(log);
    }
    await new Promise(resolve => { attendanceTx.oncomplete = resolve; });

    // 4. Add spoof logs
    if (spoofingLogs.length > 0) {
      const spoofTx = this.db.transaction(['spoof_logs'], 'readwrite');
      const spoofStore = spoofTx.objectStore('spoof_logs');
      for (const log of spoofingLogs) {
        spoofStore.add(log);
      }
      await new Promise(resolve => { spoofTx.oncomplete = resolve; });
    }

    // 5. Add initial synchronization log
    await this.logSyncAction('INITIAL_SEED', 'SUCCESS', `Seeded 50 students and ${logs.length} attendance records.`);
  }

  // --- Students Methods ---

  getStudents() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getStudentById(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  saveStudent(student) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['students'], 'readwrite');
      const store = transaction.objectStore('students');
      const request = store.put(student);

      request.onsuccess = async () => {
        await this.logSyncAction('STUDENT_REGISTRY', 'SUCCESS', `Student ${student.id} (${student.name}) registered/updated.`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- Attendance Methods ---

  getAttendanceLogs() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['attendance'], 'readonly');
      const store = transaction.objectStore('attendance');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getAttendanceForDate(dateStr) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['attendance'], 'readonly');
      const store = transaction.objectStore('attendance');
      const index = store.index('date');
      const request = index.getAll(dateStr);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Record an attendance event (Smart Kiosk scan)
  recordAttendance(studentId, status, livenessScore, timeStr) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await this.getStudentById(studentId);
        if (!student) {
          reject(new Error(`Student ${studentId} not found`));
          return;
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const log = {
          date: dateStr,
          studentId: student.id,
          studentName: student.name,
          gender: student.gender,
          department: student.department,
          status: status, // 'Present' or 'Late'
          time: timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          livenessScore: livenessScore || '100%',
          spoofAlert: false
        };

        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        // We want to overwrite or add if not exists.
        // To prevent duplicate keys, let's search if an attendance for this student+date exists.
        const index = store.index('date_studentId');
        const getReq = index.getKey([dateStr, student.id]);
        
        getReq.onsuccess = () => {
          let putReq;
          if (getReq.result !== undefined) {
            log.id = getReq.result; // Update existing record
            putReq = store.put(log);
          } else {
            putReq = store.add(log);
          }

          putReq.onsuccess = async () => {
            await this.logSyncAction('ATTENDANCE_LOG', 'SUCCESS', `Attendance marked for ${student.name} (${status})`);
            resolve(log);
          };
          putReq.onerror = () => reject(putReq.error);
        };

        getReq.onerror = () => reject(getReq.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Spoof Log Methods ---

  recordSpoofAttempt(studentId, livenessScore, type) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = studentId ? await this.getStudentById(studentId) : null;
        const name = student ? student.name : 'Unknown Intruder';
        const dept = student ? student.department : 'UNKNOWN';
        const dateStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const spoofLog = {
          date: dateStr,
          studentId: studentId || 'N/A',
          studentName: name,
          department: dept,
          time: timeStr,
          status: 'SpoofBlocked',
          livenessScore: livenessScore || '0%',
          spoofAlert: true,
          details: type || 'Liveness Failure'
        };

        const transaction = this.db.transaction(['spoof_logs'], 'readwrite');
        const store = transaction.objectStore('spoof_logs');
        const request = store.add(spoofLog);

        request.onsuccess = async () => {
          await this.logSyncAction('SECURITY_ALERT', 'CRITICAL', `Spoof attempt blocked for ${name}: ${spoofLog.details}`);
          resolve(spoofLog);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  getSpoofLogs() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['spoof_logs'], 'readonly');
      const store = transaction.objectStore('spoof_logs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Cloud Sync Simulator Logs ---

  logSyncAction(type, status, details) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }
      const syncLog = {
        timestamp: new Date().toISOString(),
        type: type, // e.g., 'SECURITY_ALERT', 'ATTENDANCE_LOG', 'STUDENT_REGISTRY'
        status: status, // 'SUCCESS', 'CRITICAL', 'PENDING'
        details: details
      };

      const transaction = this.db.transaction(['sync_logs'], 'readwrite');
      const store = transaction.objectStore('sync_logs');
      const request = store.add(syncLog);

      request.onsuccess = () => {
        // Notify listeners of a new sync event
        this.syncCallbacks.forEach(callback => callback(syncLog));
        resolve();
      };
      request.onerror = () => resolve(); // Non-blocking
    });
  }

  getSyncLogs(limit = 50) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['sync_logs'], 'readonly');
      const store = transaction.objectStore('sync_logs');
      const request = store.openCursor(null, 'prev'); // Get latest first
      const logs = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && logs.length < limit) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logs.reverse()); // Put back in chronological order
        }
      };
      request.onerror = () => resolve([]);
    });
  }

  addSyncListener(callback) {
    this.syncCallbacks.push(callback);
  }

  // Clear Database
  clearAllData() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['students', 'attendance', 'spoof_logs', 'sync_logs'], 'readwrite');
      transaction.objectStore('students').clear();
      transaction.objectStore('attendance').clear();
      transaction.objectStore('spoof_logs').clear();
      transaction.objectStore('sync_logs').clear();

      transaction.oncomplete = () => {
        console.log('Database cleared completely.');
        resolve();
      };
      transaction.onerror = (event) => reject(event.target.error);
    });
  }
}

// Instantiate database and expose globally
const db = new AttendanceDatabase();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = db;
} else {
  window.db = db;
}
