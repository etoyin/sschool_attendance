'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the new dob column
    await queryInterface.addColumn('students', 'dob', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // Remove the old age column
    await queryInterface.removeColumn('students', 'age');
  },

  async down(queryInterface, Sequelize) {
    // Add back the age column
    await queryInterface.addColumn('students', 'age', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Remove the dob column
    await queryInterface.removeColumn('students', 'dob');
  }
};
