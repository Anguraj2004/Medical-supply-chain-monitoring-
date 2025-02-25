// config.js - Replacing MongoDB with an in-memory user store

const bcrypt = require('bcrypt');

// In-memory user data storage (Dictionary)
const users = {
  admin: {
    password: bcrypt.hashSync('admin123', 10),
    email: 'admin@example.com',
    phone: '1234567890',
    sec: 'A',
    rollno: '0001',
  },
};

// Export the users object to use in other files
module.exports = users;
