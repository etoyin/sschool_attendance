const express = require('express');
const router = express.Router();
const { Class, Student, Attendance } = require('../models');
const { create } = require('domain');

// Route to list classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.findAll();
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Route to create a new class
router.post('/classes', async (req, res) => {
  try {
    const { name, description } = req.body;
    const newClass = await Class.create({ name, description });
    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating class' });
  }
});

// Route to list students in a class
router.get('/classes/:classId/students', async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await Student.findAll({ where: { classId } });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Route to mark attendance for a student
router.post('/students/:studentId/attendance', async (req, res) => {
  const { studentId } = req.params;
  const { date, present, classId } = req.body;
  try {
    // Check if attendance already exists for this student and date
    const existingAttendance = await Attendance.findOne({
      where: {
        studentId,
        date
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.present = present === 'true';
      existingAttendance.timeOfMark = new Date();
      await existingAttendance.save();
      console.log('Attendance record updated:', existingAttendance);
      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        // If it's an AJAX request or expects JSON, return JSON
        return res.status(200).json(existingAttendance);
      } else {
        // If it's a form submission, redirect back to the class page
        return res.redirect(`/class/${classId}`);
      }
    } else {
      // Create new attendance record
      const attendance = await Attendance.create({
        studentId,
        date,
        present: present === 'true',
        timeOfMark: new Date(),
        classId
      });
      console.log('Attendance record created:', attendance);
      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        // If it's an AJAX request or expects JSON, return JSON
        return res.status(201).json(attendance);
      } else {
        // If it's a form submission, redirect back to the class page
        return res.redirect(`/class/${classId}`);
      }
    }
  } catch (error) {
    console.error(error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON error
      return res.status(500).json({ message: 'Error marking attendance' });
    } else {
      // If it's a form submission, redirect back to the class page with error
      return res.redirect(`/class/${classId}?error=Error marking attendance`);
    }
  }
});

// Route to create attendance for today (kept for API compatibility)
router.post('/attendance/today', async (req, res) => {
  const { classId } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
      where: {
        date: today,
        classId: classId
      },
    });
    
    if (existingAttendance) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        // If it's an AJAX request or expects JSON, return JSON
        return res.status(200).json({ message: 'Attendance already exists for today' });
      } else {
        // If it's a form submission, redirect back to the class page
        return res.redirect(`/class/${classId}`);
      }
    }

    // Get all students in the class
    const students = await Student.findAll({ where: { classId } });

    // Create attendance records for all students
    const attendanceRecords = await Promise.all(
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

    console.log(`Created ${attendanceRecords.length} attendance records for today`);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON
      return res.status(201).json(attendanceRecords);
    } else {
      // If it's a form submission, redirect back to the class page
      return res.redirect(`/class/${classId}`);
    }
  } catch (error) {
    console.error(error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON error
      return res.status(500).json({ message: 'Error creating attendance for today' });
    } else {
      // If it's a form submission, redirect back to the class page with error
      return res.redirect(`/class/${classId}?error=Error creating attendance for today`);
    }
  }
});

// Route to register a new student
router.post('/students', async (req, res) => {
  let classId;
  try {
    const { firstName, lastName, gender, dob, contactNumber, email, classId: reqClassId } = req.body;
    classId = reqClassId;
    const student = await Student.create({
      firstName,
      lastName,
      gender,
      dob,
      contactNumber,
      email,
      classId
    });
    console.log('New student registered:', student);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON
      return res.status(201).json(student);
    } else {
      // If it's a form submission, redirect back to the class page
      return res.redirect(`/class/${classId}?message=Student registered successfully`);
    }
  } catch (error) {
    console.error(error);
    let errorMessage = 'Error registering student';

    // Check for unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors && error.errors.length > 0) {
        const field = error.errors[0].path;
        if (field === 'email') {
          errorMessage = 'A student with this email already exists';
        } else if (field === 'contactNumber') {
          errorMessage = 'A student with this contact number already exists';
        }
      }
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON error
      return res.status(400).json({ message: errorMessage });
    } else {
      // If it's a form submission, redirect back to the class page with error
      return res.redirect(`/class/${classId}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
});

// Route to get individual student data
router.get('/students/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findByPk(studentId, {
      include: [Class]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching student data' });
  }
});

// Route to update student data
router.put('/students/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { firstName, lastName, gender, dob, contactNumber, email, classId } = req.body;
  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.firstName = firstName;
    student.lastName = lastName;
    student.gender = gender;
    student.dob = dob;
    student.contactNumber = contactNumber;
    student.email = email;
    student.classId = classId;

    await student.save();

    console.log('Student updated:', student);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON
      return res.status(200).json(student);
    } else {
      // If it's a form submission, redirect back to the class page
      return res.redirect(`/class/${classId}?message=Student updated successfully`);
    }
  } catch (error) {
    console.error(error);
    let errorMessage = 'Error updating student';

    // Check for unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors && error.errors.length > 0) {
        const field = error.errors[0].path;
        if (field === 'email') {
          errorMessage = 'A student with this email already exists';
        } else if (field === 'contactNumber') {
          errorMessage = 'A student with this contact number already exists';
        }
      }
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, return JSON error
      return res.status(500).json({ message: errorMessage });
    } else {
      // If it's a form submission, redirect back to the class page with error
      return res.redirect(`/class/${classId}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
});

// Route to view attendance for a class
router.get('/classes/:classId/attendance', async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await Student.findAll({ where: { classId } });
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
    res.json(attendanceData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error viewing attendance' });
  }
});

module.exports = router;
