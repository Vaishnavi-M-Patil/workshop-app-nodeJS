const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Create MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || '98.93.59.179', // Use 'localhost' if you are running node app on host, or your MySQL container's network alias
  user: process.env.DB_USER || 'root',      // Replace with your MySQL username
  password: process.env.DB_PASSWORD || 'root', // Replace with your MySQL password
  database: process.env.DB_NAME || 'music_database',              // Replace with your DB name
  port: process.env.DB_PORT || 3306
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
  } else {
    console.log('Connected to MySQL database');
    connection.release();
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Example API route to get songs from database
app.get('/api/songs', (req, res) => {
  db.query('SELECT * FROM songs', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch songs' });
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
