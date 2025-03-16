const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    present: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    timeOfMark: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
  }, {
    tableName: 'attendance',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'date'],
      },
    ],
  });

  return Attendance;
};
