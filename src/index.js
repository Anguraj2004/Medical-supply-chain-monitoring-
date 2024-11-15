const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const collection = require('./config');

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

// Middleware to pass the error message and username to views
app.use((req, res, next) => {
  res.locals.username = req.session.username || null;

  // Retrieve messages from session
  res.locals.successMessage = req.session.successMessage || null;
  res.locals.errorMessage = req.session.errorMessage || null;

  // Clear messages from session after retrieving
  req.session.successMessage = null;
  req.session.errorMessage = null;

  next();
});
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});
 
app.get('/gps', (req, res) => {
  res.render('gps', { username: res.locals.username });
});
app.get('/home', (req, res) => {
  res.render('home', { username: res.locals.username });
});
app.get('/temperature', (req, res) => {
  res.render('temperature', { username: res.locals.username });
});
app.get('/analytics', (req, res) => {
  res.render('analytics', { username: res.locals.username });
});

app.get('/user', async (req, res) => {
  try {
    const username = req.session.username;

    if (!username) {
      // Redirect to login page if not logged in
      return res.redirect('/login');
    }

    // Fetch user data from the database
    const user = await collection.findOne({ name: username });

    if (!user) {
      // Render user page with an error message if the user is not found
      req.session.errorMessage = 'User not found';
      return res.redirect('/user');
    }

    // Pass all user data to the user page
    res.render('user', {
      username: res.locals.username,
      email: user.email,
      phone: user.phone,
      sec: user.sec,
      rollno: user.rollno,
      successMessage: res.locals.successMessage,
      errorMessage: res.locals.errorMessage,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = 'Error fetching user data';
    return res.redirect('/user');
  }
});

// Inside the /signup route
app.post('/signup', async (req, res) => {
  try {
    const data = {
      name: req.body.username,
      password: req.body.password,
      email: req.body.email,
      phone: req.body.phone,
      sec: req.body.sec,
      rollno: req.body.rollno,
    };

    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
      const isPasswordMatch = await bcrypt.compare(req.body.password, existingUser.password);

      if (isPasswordMatch) {
        res.locals.errorMessage = 'Username already exists';
        return res.render('signup', { errorMessage: res.locals.errorMessage });
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userdata = await collection.insertMany(data);
    console.log(userdata);

    req.session.username = data.name; // Store username in session
    res.locals.username = data.name;

    res.locals.successMessage = 'User registered successfully!';
    return res.redirect('/user');
  } catch (error) {
    console.error(error);
    res.locals.errorMessage = 'Error registering user';
    return res.render('signup', { errorMessage: res.locals.errorMessage });
  }
});

// Inside the /login route
app.post('/login', async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
  
    if (!check) {
      res.locals.errorMessage = 'Username not found';
      return res.render('login', { errorMessage: res.locals.errorMessage });
    }

    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

    if (isPasswordMatch) {
      req.session.username = req.body.username; // Store username in session
      res.locals.username = req.body.username;
      return res.redirect('/home');
    } else {
      res.locals.errorMessage = 'Wrong password';
      return res.render('login', { errorMessage: res.locals.errorMessage });
    }
  } catch (error) {
    console.error(error);
    res.locals.errorMessage = 'Error logging in';
    return res.render('login', { errorMessage: res.locals.errorMessage });
  }
});



app.post('/changepassword', async (req, res) => {
  try {
    const username = req.session.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    const user = await collection.findOne({ name: username });

    if (!user) {
      req.session.errorMessage = 'User not found';
      return res.redirect('/login');
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (isPasswordMatch) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await collection.updateOne({ name: username }, { $set: { password: hashedNewPassword } });

      // Set success message
      req.session.successMessage = 'Password changed successfully!';
      return res.redirect('/user');
    } else {
      // Set error message
      req.session.errorMessage = 'Incorrect old password';
      return res.redirect('/user');
    }
  } catch (error) {
    console.error(error);
    req.session.errorMessage = 'Error changing password';
    return res.redirect('/user');
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
