require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Mongoose configuration
mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('🚀 AI Attendance Backend is running!');
});

// Define Schemas
const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  department: { type: String, required: true },
  email: { type: String, required: true },
  avatar: String,
  profile: String,
  faceRegistered: { type: Boolean, default: false },
  faceDescriptor: [Number]
});

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  gender: String,
  department: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true },
  time: String,
  livenessScore: String,
  spoofAlert: { type: Boolean, default: false }
}, { timestamps: true });

const spoofLogSchema = new mongoose.Schema({
  date: String,
  studentId: String,
  studentName: String,
  department: String,
  time: String,
  status: String,
  livenessScore: String,
  spoofAlert: Boolean,
  details: String
}, { timestamps: true });

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    // Define models
    const Student = mongoose.model('Student', studentSchema);
    const Attendance = mongoose.model('Attendance', attendanceSchema);
    const SpoofLog = mongoose.model('SpoofLog', spoofLogSchema);

    // --- Students API Routes ---
    app.get('/api/students', async (req, res) => {
      try {
        const students = await Student.find();
        console.log('✅ Fetched students:', students.length);
        res.json(students);
      } catch (err) {
        console.error('❌ Error fetching students:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.get('/api/students/:id', async (req, res) => {
      try {
        const student = await Student.findOne({ id: req.params.id });
        if (!student) {
          return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
      } catch (err) {
        console.error('❌ Error fetching student:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/students', async (req, res) => {
      try {
        const student = new Student(req.body);
        await student.save();
        console.log('✅ Saved student:', student.name);
        res.status(201).json(student);
      } catch (err) {
        console.error('❌ Error saving student:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/api/students/:id', async (req, res) => {
      try {
        const student = await Student.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        if (!student) {
          return res.status(404).json({ error: 'Student not found' });
        }
        console.log('✅ Updated student:', student.name);
        res.json(student);
      } catch (err) {
        console.error('❌ Error updating student:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/students/:id', async (req, res) => {
      try {
        await Student.findOneAndDelete({ id: req.params.id });
        console.log('✅ Deleted student with id:', req.params.id);
        res.json({ message: 'Student deleted successfully' });
      } catch (err) {
        console.error('❌ Error deleting student:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // --- Attendance API Routes ---
    app.get('/api/attendance', async (req, res) => {
      try {
        const logs = await Attendance.find();
        console.log('✅ Fetched attendance logs:', logs.length);
        res.json(logs);
      } catch (err) {
        console.error('❌ Error fetching attendance:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.get('/api/attendance/date/:date', async (req, res) => {
      try {
        const logs = await Attendance.find({ date: req.params.date });
        console.log('✅ Fetched attendance for date:', req.params.date, logs.length);
        res.json(logs);
      } catch (err) {
        console.error('❌ Error fetching attendance by date:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/attendance', async (req, res) => {
      try {
        // Check if attendance already exists for this student and date
        const existingLog = await Attendance.findOne({
          date: req.body.date,
          studentId: req.body.studentId
        });

        if (existingLog) {
          const updatedLog = await Attendance.findByIdAndUpdate(existingLog._id, req.body, { new: true });
          console.log('✅ Updated attendance for:', req.body.studentName);
          res.json(updatedLog);
        } else {
          const log = new Attendance(req.body);
          await log.save();
          console.log('✅ Created attendance for:', req.body.studentName);
          res.status(201).json(log);
        }
      } catch (err) {
        console.error('❌ Error saving attendance:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // --- Spoof Logs API Routes ---
    app.get('/api/spoof-logs', async (req, res) => {
      try {
        const logs = await SpoofLog.find();
        console.log('✅ Fetched spoof logs:', logs.length);
        res.json(logs);
      } catch (err) {
        console.error('❌ Error fetching spoof logs:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/spoof-logs', async (req, res) => {
      try {
        const log = new SpoofLog(req.body);
        await log.save();
        console.log('✅ Saved spoof log');
        res.status(201).json(log);
      } catch (err) {
        console.error('❌ Error saving spoof log:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
