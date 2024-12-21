const express = require('express'); 
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const authRoutes = require('./routes/auth')(pool);
const storiesRoutes = require('./routes/stories')(pool);
const dashboardRoutes = require('./routes/dashboard'); // Add dashboard routes
const profileRoutes = require('./routes/profile')(pool);

// Use routes
app.use('/auth', authRoutes);
app.use('/stories', storiesRoutes);
app.use('/dashboard', dashboardRoutes); // Register dashboard route
app.use('/profile', profileRoutes);

// Homepage route
app.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT stories1.*, users.email AS author 
      FROM stories1 
      JOIN users ON stories1.author_id = users.id
      WHERE users.id != $1
      ORDER BY created_at DESC
    `, [req.session.user ? req.session.user.id : 0]);

    res.render('home', {
      title: 'Travel Stories',
      user: req.session.user || null,
      stories: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while fetching stories.');
  } finally {
    client.release();
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
