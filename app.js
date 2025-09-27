require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { sequelize, Class, Student, Attendance, Admin } = require('./models');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Load environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Function to send email
async function sendEmail(to, subject, html, replacements) {
  try {
    let message = html;
    for (const key in replacements) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    await transporter.sendMail({
      from: `City of David Sunday School <${EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: message,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

// Function to add a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));

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
sequelize.sync().then(async () => {
  console.log('Database synced');

  // Create initial admin user if one doesn't exist
  const admin = await Admin.findOne({ where: { username: 'admin' } });
  if (!admin) {
    await Admin.create({ username: 'admin', password: 'password' });
    console.log('Initial admin user created');
  }
}).catch(err => {
  console.error('Error syncing database:', err);
});

// Read email templates
let presentEmailHtml;
let absentEmailHtml;
let preparationEmailHtml;

async function loadEmailTemplates() {
  try {
    presentEmailHtml = await fs.readFile('present_email.html', 'utf8');
    absentEmailHtml = await fs.readFile('absent_email.html', 'utf8');
    preparationEmailHtml = await fs.readFile('preparation_email.html', 'utf8');
  } catch (error) {
    console.error('Error reading email templates:', error);
  }
}

// Call loadEmailTemplates to load the email templates
loadEmailTemplates();

// Cron job to send attendance emails every Sunday at 3 PM
cron.schedule('0 15 * * 0', async () => {
  console.log('Running attendance email cron job');

  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10);

  try {
    // Get all attendance records for today
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: formattedDate,
      },
    });

    // Separate students into present and absent groups
    const presentStudentIds = attendanceRecords
      .filter((record) => record.present)
      .map((record) => record.studentId);
    const absentStudentIds = attendanceRecords
      .filter((record) => !record.present)
      .map((record) => record.studentId);

    // Get all students
    const allStudents = await Student.findAll();

    // Separate students into present and absent groups
    const presentStudents = allStudents.filter((student) =>
      presentStudentIds.includes(student.id)
    );
    const absentStudents = allStudents.filter((student) =>
      !presentStudentIds.includes(student.id)
    );

    // Send emails to present students
    for (const student of presentStudents) {
      console.log(`Sending email to ${student.email}`);
      await sendEmail(
        student.email,
        'Attendance Confirmation',
        presentEmailHtml,
        {
          firstName: student.firstName,
          lastName: student.lastName,
          date: formattedDate,
        }
      );
      await delay(1000); // Add a 1-second delay between emails
    }

    // Send emails to absent students
    for (const student of absentStudents) {
      console.log(`Sending email to ${student.email}`);
      await sendEmail(
        student.email,
        'Attendance Alert',
        absentEmailHtml,
        {
          firstName: student.firstName,
          lastName: student.lastName,
          date: formattedDate,
        }
      );
      await delay(1000); // Add a 1-second delay between emails
    }

    console.log('Attendance emails sent successfully');
  } catch (error) {
    console.error('Error sending attendance emails:', error);
  }
}, {
  scheduled: true,
  timezone: 'Africa/Lagos' // Set the timezone to Africa/Lagos
});

// Function to send preparation emails to all students
async function sendPreparationEmails() {
  console.log('Sending preparation emails to all students');
  
  try {
    // Get all students
    const allStudents = await Student.findAll();

    // Send preparation emails to all students
    for (const student of allStudents) {
      console.log(`Sending preparation email to ${student.email}`);
      await sendEmail(
        student.email,
        'Sunday School Preparation - Reserved Seat Awaits! 🎓',
        preparationEmailHtml,
        {
          firstName: student.firstName,
          lastName: student.lastName,
        }
      );
      await delay(1000); // Add a 1-second delay between emails
    }

    console.log('Preparation emails sent successfully');
  } catch (error) {
    console.error('Error sending preparation emails:', error);
  }
}

// Cron job to send preparation emails every Saturday at 6 PM
cron.schedule('0 18 * * 6', async () => {
  console.log('Running preparation email cron job');
  await sendPreparationEmails();
}, {
  scheduled: true,
  timezone: 'Africa/Lagos' // Set the timezone to Africa/Lagos
});

// Routes
app.get('/', isLoggedIn, async (req, res) => {
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

app.get('/classes', isLoggedIn, async (req, res) => {
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

app.get('/reports', isLoggedIn, async (req, res) => {
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
    console.error('Error fetching classes:', error);
    res.render('reports', { classes: [] });
  }
});

app.get('/settings', isLoggedIn, async (req, res) => {
  try {
    res.render('settings');
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).send('Error loading settings');
  }
});

app.get('/class/:classId', isLoggedIn, async (req, res) => {
  const { classId } = req.params;
  const { error, message } = req.query;
  try {
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).send('Class not found');
    }

    const students = await Student.findAll({ where: { classId } });
    
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
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session.adminId) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

app.get('/admin/dashboard', isLoggedIn, (req, res) => {
  res.render('admin/dashboard');
});

app.use('/api', routes);

// Add a route to manually trigger the cron job
app.get('/trigger-attendance-emails', async (req, res) => {
  console.log('Manually triggering attendance email cron job');

  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10);

  try {
    // Get all attendance records for yesterday
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: formattedDate,
      },
    });

    // Separate students into present and absent groups
    const presentStudentIds = attendanceRecords
      .filter((record) => record.present)
      .map((record) => record.studentId);
    const absentStudentIds = attendanceRecords
      .filter((record) => !record.present)
      .map((record) => record.studentId);

    // Get all students
    const allStudents = await Student.findAll();

    // Separate students into present and absent groups
    const presentStudents = allStudents.filter((student) =>
      presentStudentIds.includes(student.id)
    );
    const absentStudents = allStudents.filter((student) =>
      !presentStudentIds.includes(student.id)
    );

    // Send emails to present students
    for (const student of presentStudents) {
      await sendEmail(
        student.email,
        'Attendance Confirmation',
        presentEmailHtml,
        {
          firstName: student.firstName,
          lastName: student.lastName,
          date: formattedDate,
        }
      );
    }

    // Send emails to absent students
    for (const student of absentStudents) {
      await sendEmail(
        student.email,
        'Attendance Alert',
        absentEmailHtml,
        {
          firstName: student.firstName,
          lastName: student.lastName,
          date: formattedDate,
        }
      );
    }

    console.log('Attendance emails sent successfully');
    res.send('Attendance emails triggered successfully');
  } catch (error) {
    console.error('Error sending attendance emails:', error);
    res.status(500).send('Error sending attendance emails');
  }
});

// Route to manually trigger preparation emails
app.get('/trigger-preparation-emails', async (req, res) => {
  console.log('Manually triggering preparation email sending');
  
  try {
    await sendPreparationEmails();
    res.json({ message: 'Preparation emails sent successfully' });
  } catch (error) {
    console.error('Error sending preparation emails:', error);
    res.status(500).json({ error: 'Failed to send preparation emails' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
