const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const socketio = require('socket.io');
const express = require('express');
const db = require('./db'); // Import database

const app = express();
const server = http.createServer(app);

// --- WebSocket for ESP32 ---
const wss = new WebSocket.Server({ server });

// --- Socket.IO for Frontend ---
const io = socketio(server);

// Serve static files (later React frontend will go here)
app.use(express.static('public'));

// ESP32 WebSocket connection
wss.on('connection', (ws) => {
  console.log('ESP32 connected via WebSocket');

  ws.on('message', (message) => {
    console.log(`Humidity received: ${message}`);
    
    const humidity = parseInt(message);
    if (!isNaN(humidity)) {
      // Save to database
      db.run(`INSERT INTO humidity_readings (value) VALUES (?)`, [humidity], (err) => {
        if (err) {
          console.error('DB Insert Error: ', err);
        } else {
          console.log('Humidity saved:', humidity);
        }
      });

      // Send to frontend clients
      io.emit('humidityData', humidity);
    }
  });

  ws.on('close', () => {
    console.log('ESP32 disconnected');
  });
});

// Frontend WebSocket (Socket.IO)
io.on('connection', (socket) => {
  console.log('Frontend client connected');
  socket.on('disconnect', () => {
    console.log('Frontend client disconnected');
  });
});

// API to get past humidity readings
app.get('/api/readings', (req, res) => {
  db.all(`SELECT * FROM humidity_readings ORDER BY timestamp DESC LIMIT 50`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database Error' });
    } else {
      res.json(rows);
    }
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
  console.log('Readings at: http://localhost:3000/api/readings');
});
