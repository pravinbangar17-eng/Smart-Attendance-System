// mock-data.js
// Mock data generator for the AI Attendance System

const DEPARTMENTS = [
  { id: 'CS', name: 'Computer Engineering' },
  { id: 'EE', name: 'Electrical Engineering' },
  { id: 'ME', name: 'Mechanical Engineering' },
  { id: 'BA', name: 'civil Engineering' }
];

const STUDENT_NAMES = [
  'Pravin Bangar',
  'Yatharth Donarkar',
  'Atharv Thakre',
  'Mayur Kurdakar',
  'Ananya Verma',
  'Aditya Joshi',
  'Karan Gupta',
  'Priya Kulkarni',
  'Rahul Patil',
  'Sakshi Sharma',
  'Rohit Deshmukh',
  'Sneha Patil',
  'Om Wankhede',
  'Tanvi Bhosale',
  'Aarav Shinde',
  'Neha Jadhav',
  'Vedant Pande',
  'Pooja Kale',
  'Akash Pawar',
  'Rutuja More',
  'Saurabh Khandelwal',
  'Shreya Kulkarni',
  'Nikhil Chavan',
  'Vaishnavi Patil',
  'Harshal Raut',
  'Aditi Deshpande',
  'Tejas Gawande',
  'Komal Bhoyar',
  'Swapnil Ingole',
  'Bhagyashree Korde',
  'Shubham Thakare',
  'Siddhi Dhote',
  'Abhishek Meshram',
  'Prachi Borkar',
  'Akshay Bhagat',
  'Ankita Kapse',
  'Tushar Mohite',
  'Mrunal Patil',
  'Nilesh Wagh',
  'Pallavi Agrawal',
  'Ganesh Sonkusare',
  'Riya Tiwari',
  'Harsh Agnihotri',
  'Shruti Bhende',
  'Yogesh Chandekar',
  'Sonal Dhurve',
  'Aman Chouhan',
  'Kajal Yadav',
  'Manish Zade',
  'Rashmi Bhure'
];


// Generate 50 students
const initialStudents = [];
for (let i = 0; i < 50; i++) {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const deptCode = dept.id;
  const num = i + 1; // No leading zeros
  const studentId = `${deptCode}-2026-${num}`;
  const name = STUDENT_NAMES[i];

  // Create an email from the name
  const email = name.toLowerCase().replace(' ', '.') + '@campus.edu';

  // Assign a profile photo using dicebear avatars
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  // Individual attendance profile:
  // - 'excellent' (92% - 99% present)
  // - 'average' (80% - 91% present)
  // - 'poor' (50% - 79% present)
  let profile = 'average';
  const rand = Math.random();
  if (rand < 0.20) profile = 'excellent';
  else if (rand > 0.85) profile = 'poor';

  // Face registration: register 45 of 50 students, leave 5 unregistered
  // so the user can demonstrate registering a new student face in the UI!
  const isFaceRegistered = i < 45;

  initialStudents.push({
  id: studentId,
  name: name,
  gender: i % 2 === 0 ? 'Male' : 'Female',
  department: deptCode,
  email: email,
  avatar: avatar,
  profile: profile,
  faceRegistered: isFaceRegistered,
  faceDescriptor: null
});
}

// Generate weather for a specific date
function getWeatherForDate(date) {
  const day = date.getDate();
  const month = date.getMonth();
  // Deterministic-ish weather based on date
  const hash = (day * 31 + month * 17) % 10;
  if (hash < 2) return 'Rainy';
  if (hash === 2) return 'Overcast';
  return 'Sunny';
}

// Check if a date is during midterms (e.g. week of June 15th to 20th, 2026)
function isExamSeason(date) {
  const day = date.getDate();
  const month = date.getMonth();
  // Let's make June 15 to June 21, 2026 exam season
  return (month === 5 && day >= 15 && day <= 21);
}

// Generate attendance history for the past 30 days
function generateMockAttendance(students, startDate = new Date(2026, 4, 8), endDate = new Date(2026, 5, 8)) {
  const logs = [];
  const spoofingLogs = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const weather = getWeatherForDate(currentDate);
      const exam = isExamSeason(currentDate);

      students.forEach(student => {
        // Base attendance probability based on student profile
        let attendanceProbability = 0.85; // 'average'
        if (student.profile === 'excellent') attendanceProbability = 0.96;
        if (student.profile === 'poor') attendanceProbability = 0.65;

        // Modifiers
        if (weather === 'Rainy') attendanceProbability -= 0.12;
        if (weather === 'Overcast') attendanceProbability -= 0.03;

        // Friday slack off
        if (dayOfWeek === 5) attendanceProbability -= 0.08;
        // Monday blues
        if (dayOfWeek === 1) attendanceProbability -= 0.04;

        // Exam season boost
        if (exam) attendanceProbability = Math.min(0.99, attendanceProbability + 0.25);

        // Check presence
        const isPresent = Math.random() < attendanceProbability;
        const logDateStr = currentDate.toISOString().split('T')[0];

        if (isPresent) {
          // Determine if late (class starts at 8:00 AM)
          // Average lateness probability: 10%
          let lateProbability = 0.10;
          if (student.profile === 'poor') lateProbability = 0.25;
          if (weather === 'Rainy') lateProbability += 0.15;
          if (dayOfWeek === 1 || dayOfWeek === 5) lateProbability += 0.08;

          const isLate = Math.random() < lateProbability;

          let status = 'Present';
          let time = '';

          if (isLate) {
            status = 'Late';
            // Late between 8:01 AM and 8:25 AM
            const min = Math.floor(Math.random() * 25) + 1;
            time = `08:${String(min).padStart(2, '0')} AM`;
          } else {
            // Present between 7:45 AM and 8:00 AM
            const min = Math.floor(Math.random() * 15);
            time = `07:${String(45 + min).padStart(2, '0')} AM`;
          }

          logs.push({
    date: logDateStr,
    studentId: student.id,
    studentName: student.name,
    gender: student.gender,
    department: student.department,
    status: status,
    time: time,
    livenessScore: (90 + Math.random() * 9).toFixed(1) + '%',
    spoofAlert: false
          });
        } else {
          // Absent
          logs.push({
    date: logDateStr,
    studentId: student.id,
    studentName: student.name,
    gender: student.gender,
    department: student.department,
    status: 'Absent',
    time: '--:--',
    livenessScore: 'N/A',
    spoofAlert: false
});

          // Occasionally record a spoofing attempt (some proxy attendance simulation)
          // 0.5% chance per absent student that they tried to scan a printout photo
          if (Math.random() < 0.008 && student.faceRegistered) {
            const min = Math.floor(Math.random() * 30);
            const spoofTime = `08:${String(min).padStart(2, '0')} AM`;
            spoofingLogs.push({
              date: logDateStr,
              studentId: student.id,
              studentName: student.name,
              department: student.department,
              time: spoofTime,
              status: 'SpoofBlocked',
              livenessScore: (15 + Math.random() * 25).toFixed(1) + '%', // low liveness
              spoofAlert: true,
              details: Math.random() > 0.5 ? '2D Photo Printout Detected' : 'Electronic Screen Replay Detected'
            });
          }
        }
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { logs, spoofingLogs };
}

// Export for ES Modules or common scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEPARTMENTS, initialStudents, generateMockAttendance, getWeatherForDate };
} else {
  window.DEPARTMENTS = DEPARTMENTS;
  window.initialStudents = initialStudents;
  window.generateMockAttendance = generateMockAttendance;
  window.getWeatherForDate = getWeatherForDate;
}
