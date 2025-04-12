import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const socket = io('http://localhost:3000');

function App() {
  const [humidity, setHumidity] = useState(null);
  const [readings, setReadings] = useState([]);
  const [darkMode, setDarkMode] = useState(false); // <-- Theme State
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/readings`)
      .then((response) => {
        setReadings(response.data.reverse());
      })
      .catch((error) => {
        console.error('Error fetching readings:', error);
      });

    socket.on('humidityData', (data) => {
      setHumidity(data);
      setReadings(prevReadings => {
        const newReadings = [...prevReadings, { value: data, timestamp: new Date().toISOString() }];
        if (newReadings.length > 50) {
          newReadings.shift();
        }
        return newReadings;
      });
    });

    return () => socket.off('humidityData');
  }, []);

  const chartData = {
    labels: readings.map(r => new Date(r.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Humidity (%)',
        data: readings.map(r => r.value),
        fill: false,
        backgroundColor: darkMode ? '#bb86fc' : 'rgb(75, 192, 192)', // Purple accent in dark mode
        borderColor: darkMode ? '#bb86fc' : 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Humidity (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  // Function to sort the readings based on the current sorting config
  const sortedReadings = [...readings].sort((a, b) => {
    const aValue = sortConfig.key === 'timestamp' ? new Date(a.timestamp) : a.value;
    const bValue = sortConfig.key === 'timestamp' ? new Date(b.timestamp) : b.value;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Function to handle column header click for sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="App-header">
        <h1>🌱 Smart Pot Dashboard</h1>

        {/* Theme Toggle Button */}
        <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
          {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>

        <h2>Live Humidity: {humidity !== null ? `${humidity}%` : 'Waiting for data...'}</h2>

        <div style={{ width: '90%', margin: '0 auto' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        <h3>Recent Readings (Last 50)</h3>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')}>Timestamp {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? '( Oldest )' : '( Latest )') : ''}</th>
              <th onClick={() => handleSort('value')}>Humidity (%) {sortConfig.key === 'value' ? (sortConfig.direction === 'asc' ? '( Oldest )' : '( Latest )') : ''}</th>
            </tr>
          </thead>
          <tbody>
            {sortedReadings.map((reading, index) => (
              <tr key={index}>
                <td>{new Date(reading.timestamp).toLocaleString()}</td>
                <td>{reading.value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;
