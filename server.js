require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { sequelize, Class, Student, Attendance } = require('./models');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Create database if it doesn't exist
async function createDatabase() {
  try {
    await sequelize.query('CREATE DATABASE IF NOT EXISTS school_attendance;');
    console.log('Database created or already exists.');
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

// Call createDatabase before testing connection and syncing models
createDatabase().then(async () => {
  testConnection();
});

// Sync database models
// Using sync without alter: true to prevent modifying existing tables
// This avoids the "Too many keys specified" error
sequelize.sync().then(() => {
  console.log('Database synced');
}).catch(err => {
  console.error('Error syncing database:', err);
});

// Routes
app.get('/', async (req, res) => {
  try {
    const classes = await Class.findAll();
    
    // Get student count for each class
    const classesWithStudentCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.count({ where: { classId: cls.id } });
        return {
          ...cls.toJSON(),
          studentCount
        };
      })
    );
    
    res.render('index', { classes: classesWithStudentCount });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.render('index', { classes: [] });
  }
});

app.get('/classes', async (req, res) => {
  try {
    const classes = await Class.findAll();
    
    // Get student count for each class
    const classesWithStudentCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.count({ where: { classId: cls.id } });
        return {
          ...cls.toJSON(),
          studentCount
        };
      })
    );
    
    res.render('classes', { classes: classesWithStudentCount });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.render('classes', { classes: [] });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const classes = await Class.findAll();
    
    // Get student count for each class
    const classesWithStudentCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.count({ where: { classId: cls.id } });
        return {
          ...cls.toJSON(),
          studentCount
        };
      })
    );
    
    res.render('reports', { classes: classesWithStudentCount });
  } catch (error) {
    console.error('Error fetching classes for reports:', error);
    res.render('reports', { classes: [] });
  }
});

app.get('/settings', async (req, res) => {
  try {
    res.render('settings');
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).send('Error loading settings');
  }
});

app.get('/class/:classId', async (req, res) => {
  const { classId } = req.params;
  const { error, message } = req.query;
  try {
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).send('Class not found');
    }

    const students = await Student.findAll({ where: { classId } });
    
    // Automatically initialize attendance records for today if they don't exist
    const today = new Date().toISOString().slice(0, 10);
    const existingAttendance = await Attendance.findOne({
      where: {
        date: today,
        classId: classId
      },
    });
    
    if (!existingAttendance && students.length > 0) {
      // Create attendance records for all students
      await Promise.all(
        students.map(async (student) => {
          return Attendance.create({
            studentId: student.id,
            date: today,
            present: false, // Default to absent
            classId: classId,
            timeOfMark: new Date()
          });
        })
      );
      console.log(`Automatically created attendance records for class ${classId} on ${today}`);
    }
    
    // Get all attendance records for this class
    const attendanceData = await Promise.all(
      students.map(async (student) => {
        const attendance = await Attendance.findAll({
          where: {
            studentId: student.id,
          },
        });
        return {
          student,
          attendance,
        };
      })
    );

    // Get unique dates from attendance records
    const dates = [...new Set(
      attendanceData
        .flatMap(item => item.attendance)
        .map(a => a.date)
    )].sort();

    res.render('class', { classData, students, attendanceData, dates, error, message });
  } catch (error) {
    console.error('Error fetching class data:', error);
    res.status(500).send('Error fetching class data');
  }
});

// API routes
const routes = require('./routes');
app.use('/api', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
