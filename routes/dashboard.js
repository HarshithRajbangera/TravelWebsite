const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const userId = req.session.user.id;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT stories1.* 
      FROM stories1
      JOIN trip_participants ON stories1.id = trip_participants.story_id
      WHERE trip_participants.user_id = $1
      `,
      [userId]
    );

    const joinedTrips = result.rows;
    res.render('dashboard', { username: req.session.user.username, joinedTrips });
  } finally {
    client.release();
  }
});

module.exports = router;
