import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');  // Make sure your server is running!

function App() {
  const [humidity, setHumidity] = useState(null);
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    // Fetch past readings
    axios.get(`${process.env.REACT_APP_API_URL}/api/readings`)
  .then((response) => {
    setReadings(response.data);
  })
  .catch((error) => {
    console.error('Error fetching readings:', error);
  });


    // WebSocket: receive live humidity updates
    socket.on('humidityData', (data) => {
      setHumidity(data);
    });

    // Clean up the socket connection on component unmount
    return () => socket.off('humidityData');
  }, []);

  return (
    <div className="App">
      <h1>Smart Pot Dashboard</h1>

      <h2>Live Humidity: {humidity !== null ? `${humidity}%` : 'Waiting for data...'}</h2>

      <h3>Recent Readings</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Humidity</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td>{reading.id}</td>
              <td>{reading.value}%</td>
              <td>{new Date(reading.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
