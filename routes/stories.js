const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
  };

  // Add a story
  router.get('/add', isAuthenticated, (req, res) => {
    res.render('addStory', { title: 'Add a Story' });
  });

  router.post('/add', isAuthenticated, async (req, res) => {
    const { title, content, from_location, destination_address, perspective } = req.body;
    const client = await pool.connect();
  
    try {
      // Insert story into the database
      await client.query(
        `INSERT INTO stories1 (title, content, from_location, destination_address, perspective, author_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [title, content, from_location, destination_address, perspective, req.session.user.id]
      );
  
      // Redirect to stories page after adding
      res.redirect('/stories');
    } catch (err) {
      console.error('Error adding story:', err);
      res.status(500).send('Error adding story.');
    } finally {
      client.release();
    }
  });

  // View all stories (excluding the logged-in user's posts)
  router.get('/', async (req, res) => {
    const client = await pool.connect();
  
    try {
      const result = await client.query(
        `SELECT stories1.*, users.email AS author 
         FROM stories1 
         JOIN users ON stories1.author_id = users.id 
         ORDER BY created_at DESC`
      );
  
      res.render('stories', { title: 'Stories', stories: result.rows });
    } catch (err) {
      console.error('Error fetching stories:', err);
      res.status(500).send('Error fetching stories.');
    } finally {
      client.release();
    }
  });
  
  // Join a trip
 // Join a trip
router.post('/:id/join', isAuthenticated, async (req, res) => {
  const storyId = req.params.id;
  const userId = req.session.user.id;

  const client = await pool.connect();
  try {
    // Check if the user has already joined the trip
    const checkResult = await client.query(
      'SELECT * FROM trip_participants WHERE story_id = $1 AND user_id = $2',
      [storyId, userId]
    );

    if (checkResult.rows.length > 0) {
      return res.redirect('/dashboard'); // Already joined, redirect to dashboard
    }

    // Add the user to the trip participants
    await client.query(
      'INSERT INTO trip_participants (story_id, user_id) VALUES ($1, $2)',
      [storyId, userId]
    );

    res.redirect('/dashboard'); // Redirect to dashboard after joining
  } catch (err) {
    console.error('Error joining trip:', err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

  // View a single story
  router.get('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM stories1 WHERE id = $1', [req.params.id]);
      const story = result.rows[0];
      if (story) {
        res.render('story', { title: story.title, story });
      } else {
        res.status(404).send('Story not found');
      }
    } finally {
      client.release();
    }
  });
  router.post('/:id/join', isAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
      // Check if the trip has already been joined by this user
      const existingTrip = await client.query(
        'SELECT * FROM trips WHERE user_id = $1 AND story_id = $2',
        [req.session.user.id, req.params.id]
      );
  
      if (existingTrip.rows.length > 0) {
        return res.redirect('/profile'); // Redirect if trip already joined
      }
  
      // Insert into trips table
      await client.query(
        'INSERT INTO trips (user_id, story_id) VALUES ($1, $2)',
        [req.session.user.id, req.params.id]
      );
      res.redirect('/profile'); // Redirect to profile after joining
    } catch (err) {
      console.error(err);
      res.status(500).send('Error joining the trip.');
    } finally {
      client.release();
    }
  });
  
  
  
  

  return router;
};
