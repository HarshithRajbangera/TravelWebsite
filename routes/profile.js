const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Middleware to check user session
  const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
  };

  // Profile route
  router.get('/', isAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = req.session.user.id;

      // Fetch user details
      const userDetails = await client.query('SELECT email FROM users WHERE id = $1', [userId]);

      // Fetch stories created by the user
      const userStories = await client.query(
        'SELECT * FROM stories1 WHERE author_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      // Fetch trips joined by the user
      const joinedTrips = await client.query(`
        SELECT stories1.title, stories1.from_location, stories1.destination_address 
        FROM trips
        JOIN stories1 ON trips.story_id = stories1.id
        WHERE trips.user_id = $1
        ORDER BY trips.joined_at DESC
      `, [userId]);

      // Pass the necessary data to the view
      res.render('profile', {
        title: 'Profile',
        user: req.session.user,
        userDetails: userDetails.rows[0],
        userStories: userStories.rows,  // Ensure userStories is passed
        joinedTrips: joinedTrips.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while loading the profile.');
    } finally {
      client.release();
    }
  });
  // In your profile.js (or the appropriate route file)
router.get('/', isAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
      // Fetch user details
      const userResult = await client.query('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
      const user = userResult.rows[0];
  
      // Fetch stories by the user (posts)
      const postsResult = await client.query('SELECT * FROM stories1 WHERE author_id = $1', [req.session.user.id]);
  
      // Fetch the total number of trips the user has joined
      const tripsResult = await client.query('SELECT COUNT(*) AS trips_joined FROM trips WHERE user_id = $1', [req.session.user.id]);
  
      res.render('profile', {
        title: 'Your Profile',
        user,
        posts: postsResult.rows,
        tripsJoined: tripsResult.rows[0].trips_joined,
      });
    } finally {
      client.release();
    }
  });
  

  return router;
};
