const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Note: This creates an index. MySQL has a limit of 64 indexes per table.
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'classes',
    timestamps: true,
  });

  return Class;
};
