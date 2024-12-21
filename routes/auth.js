const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (pool) => {
  const router = express.Router();

  // Login route
  router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/stories');
      } else {
        res.status(401).send('Invalid credentials');
      }
    } finally {
      client.release();
    }
  });

  // Signup route
  router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Signup' });
  });

  router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
      res.redirect('/auth/login');
    } finally {
      client.release();
    }
  });

  // Logout route
  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  return router;
};
