const express = require('express');
const router = express.Router();
const { Admin } = require('../models');
const bcrypt = require('bcrypt');
const session = require('express-session');

router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));

router.get('/register', (req, res) => {
  res.render('admin/register');
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.create({ username, password });
    req.session.adminId = admin.id;
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('admin/register', { error: 'Registration failed' });
  }
});

router.get('/login', (req, res) => {
  res.render('admin/login');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.render('admin/login', { error: 'Invalid username or password' });
    }

    const validPassword = await admin.validPassword(password);
    if (!validPassword) {
      return res.render('admin/login', { error: 'Invalid username or password' });
    }

    req.session.adminId = admin.id;
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: 'Login failed' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/admin/login');
  });
});

module.exports = router;
