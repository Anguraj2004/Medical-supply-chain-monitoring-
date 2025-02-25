const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add session middleware
app.use(
  session({
    secret: '5a2f9e3d4b9ec0d89e308ce9f4d4f37a',
    resave: false,
    saveUninitialized: true,
  })
);

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

// Middleware to pass the error message and username to views
app.use((req, res, next) => {
  res.locals.username = req.session.username || null;

  res.locals.successMessage = req.session.successMessage || null;
  res.locals.errorMessage = req.session.errorMessage || null;

  req.session.successMessage = null;
  req.session.errorMessage = null;

  next();
});

app.get('/login', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/gps', (req, res) => res.render('gps', { username: res.locals.username }));
app.get('/home', (req, res) => res.render('home', { username: res.locals.username }));
app.get('/temperature', (req, res) => res.render('temperature', { username: res.locals.username }));
app.get('/analytics', (req, res) => res.render('analytics', { username: res.locals.username }));

app.get('/user', (req, res) => {
  const username = req.session.username;
  if (!username || !users[username]) {
    req.session.errorMessage = 'User not found';
    return res.redirect('/login');
  }

  const user = users[username];
  res.render('user', {
    username: res.locals.username,
    email: user.email,
    phone: user.phone,
    sec: user.sec,
    rollno: user.rollno,
    successMessage: res.locals.successMessage,
    errorMessage: res.locals.errorMessage,
  });
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password, email, phone, sec, rollno } = req.body;

  if (users[username]) {
    res.locals.errorMessage = 'Username already exists';
    return res.render('signup', { errorMessage: res.locals.errorMessage });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword, email, phone, sec, rollno };

  req.session.username = username;
  res.locals.username = username;
  req.session.successMessage = 'User registered successfully!';
  res.redirect('/user');
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!users[username]) {
    res.locals.errorMessage = 'Username not found';
    return res.render('login', { errorMessage: res.locals.errorMessage });
  }

  const isPasswordMatch = await bcrypt.compare(password, users[username].password);
  if (isPasswordMatch) {
    req.session.username = username;
    res.locals.username = username;
    return res.redirect('/home');
  } else {
    res.locals.errorMessage = 'Wrong password';
    return res.render('login', { errorMessage: res.locals.errorMessage });
  }
});

// Change password route
app.post('/changepassword', async (req, res) => {
  const username = req.session.username;
  const { oldPassword, newPassword } = req.body;

  if (!username || !users[username]) {
    req.session.errorMessage = 'User not found';
    return res.redirect('/login');
  }

  const isPasswordMatch = await bcrypt.compare(oldPassword, users[username].password);
  if (isPasswordMatch) {
    users[username].password = await bcrypt.hash(newPassword, 10);
    req.session.successMessage = 'Password changed successfully!';
    return res.redirect('/user');
  } else {
    req.session.errorMessage = 'Incorrect old password';
    return res.redirect('/user');
  }
});

const port = 4000;
app.listen(port, () => console.log(`Server running on Port: ${port}`));
