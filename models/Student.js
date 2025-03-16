const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'students',
    timestamps: true,
  });

  return Student;
};
