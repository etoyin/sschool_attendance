'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Classes', [
      { name: 'Emerald', description: 'YAYA', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Jasper', description: 'YAYA', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sardius', description: 'YAYA', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Jaccinth', description: 'YAYA', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gold', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Crystal', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Topaz', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sapphire', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Beryl', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Special', description: 'ADULT', createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Classes', null, {});
  }
};
