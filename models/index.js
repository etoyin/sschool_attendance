const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

// Import models
const StudentModel = require('./Student');
const AttendanceModel = require('./Attendance');
const ClassModel = require('./Class');

// Initialize models
const Student = StudentModel(sequelize);
const Attendance = AttendanceModel(sequelize);
const Class = ClassModel(sequelize);

// Set up associations
Student.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Student, { foreignKey: 'classId' });

Student.hasMany(Attendance, { foreignKey: 'studentId' });
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Attendance.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Attendance, { foreignKey: 'classId' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Student,
  Attendance,
  Class,
};
