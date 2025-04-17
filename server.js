const http = require('http');
const WebSocket = require('ws');
const socketio = require('socket.io');
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import database
const fs = require('fs'); 
const path = require('path');
const { log } = require('console');

const app = express();
app.use(cors());  
app.use(express.json());

const server = http.createServer(app);

// --- Threshold Storage ---
const thresholdFile = path.join(__dirname, 'threshold.json'); 

function getThreshold() {
  try {
    const data = fs.readFileSync(thresholdFile);
    return JSON.parse(data).threshold;
  } catch (err) {
    return 31; // default threshold if file doesn't exist or fails
  }
}

function setThreshold(value) {
  fs.writeFileSync(thresholdFile, JSON.stringify({ threshold: value }));
}

// --- API to get current threshold ---
app.get('/api/threshold', (req, res) => { 
  res.json({ threshold: getThreshold() });
});

// --- API to set new threshold ---
app.post('/api/threshold', (req, res) => { 
  const { threshold } = req.body;
  if (typeof threshold === 'number') {
    setThreshold(threshold);
    res.sendStatus(200);
  } else {
    res.status(400).send('Invalid threshold');
  }
});

const wss = new WebSocket.Server({ noServer: true });

// --- Socket.IO for Frontend ---
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5000", 
    methods: ["GET", "POST"]
  }
});

// --- Upgrade request handler (WebSocket path filtering) ---
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/esp32') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy(); // Reject anything else
  }
});

// --- Handle ESP32 connections ---
wss.on('connection', (ws, req) => {
  console.log('ESP32 connected via WebSocket');

  // Send current threshold to ESP32 on connect
  ws.send(JSON.stringify({ type: 'threshold', value: getThreshold() })); // <-- New: Send current threshold on connect

  ws.on('message', (message) => {
    console.log(`Humidity received: ${message}`);

    const humidity = parseInt(message);
    if (!isNaN(humidity)) {
      db.run(`INSERT INTO humidity_readings (value) VALUES (?)`, [humidity], (err) => {
        if (err) {
          console.error('DB Insert Error:', err);
        } else {
          console.log('Humidity saved:', humidity);
        }
      });

      // Emit to frontend
      io.emit('humidityData', humidity);
    } else {
      console.warn('Ignored non-numeric message from ESP32:', message);
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

  socket.on('thresholdUpdate', (newThreshold) => {
    console.log('New threshold from frontend:', newThreshold);

    setThreshold(newThreshold); // set new threshold to file

    // Broadcast it to all ESP32 clients (WebSocket)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'threshold', value: newThreshold }));
      }
    });
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
