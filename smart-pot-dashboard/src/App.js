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

const API_BASE = `http://${window.location.hostname}:3000`;
const socket = io(API_BASE); // Dynamic socket connection for both mobile/PC

function App() {
  const [humidity, setHumidity] = useState(null);
  const [readings, setReadings] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme !== null ? savedTheme === 'true' : true;
  });
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [threshold, setThreshold] = useState(() => {
    const stored = localStorage.getItem('threshold');
    return stored !== null ? parseInt(stored, 10) : 39;
  });


//  Get previous set threshold 
  useEffect(() => {
    axios.get(`${API_BASE}/api/threshold`)
      .then((response) => {
        setThreshold(response.data.threshold);
        localStorage.setItem('threshold', response.data.threshold);
      })
      .catch((error) => {
        console.error('Failed to load threshold:', error);
      });
  }, []);


  //  Get humidity history
  useEffect(() => {
    axios.get(`${API_BASE}/api/readings`)
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

    // Sync threshold across all devices
    socket.on('thresholdData', (value) => {
      setThreshold(value);
      localStorage.setItem('threshold', value);
    });

    return () => {
      socket.off('humidityData');
      socket.off('thresholdData'); // Cleanup listener
    };
  }, []);


  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);


  // Handle threshold change
  const handleThresholdChange = (e) => {
    const newThreshold = parseInt(e.target.value, 10);
    setThreshold(newThreshold);
    localStorage.setItem('threshold', newThreshold);

    fetch(`${API_BASE}/api/threshold`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: newThreshold }) 
    }).catch(err => console.error('Failed to save threshold:', err));

    socket.emit('thresholdUpdate', newThreshold); // Send threshold update to server
  };

  const handleThemeToggle = () => {
    setDarkMode(prev => !prev);
  };

  const chartData = {
    labels: readings.map(r => new Date(r.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Humidity (%)',
        data: readings.map(r => r.value),
        fill: false,
        backgroundColor: darkMode ? '#bb86fc' : 'rgb(75, 192, 192)',
        borderColor: darkMode ? '#bb86fc' : 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Humidity (%)' }
      },
      x: {
        title: { display: true, text: 'Time' }
      }
    }
  };

  const sortedReadings = [...readings].sort((a, b) => {
    const aValue = sortConfig.key === 'timestamp' ? new Date(a.timestamp) : a.value;
    const bValue = sortConfig.key === 'timestamp' ? new Date(b.timestamp) : b.value;
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      {/* New Fancy Toggle Switch */}
      <div className="toggle-container">
        <label className="switch">
        <label for="darkmode-toggle">
 <svg class="moon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">

<path d="m36.25 6.48c.75-.15 1.93.94 2.75 1.52s4 2.63 4.18 4.13-.84 3.62 1 4.75 4.25 2.81 4.25 4.25-1 4.34.38 5.34 2.34 1.1 2.94 3-1 5.6-1.1 6.19a2.41 2.41 0 0 0 .78 1.69 3.18 3.18 0 0 1 .35 4c-1.28 2-2.72 3.28-2.44 3.91a5.18 5.18 0 0 1 0 3.5c-.53 1-4.22 4.43-6.19 6.06s-2.16 2-2.87 2.19a20.33 20.33 0 0 1 -13.6-1.82c-6.37-3.47-11.12-8-13.4-14.84s-1.88-11.06-.32-15.78 5.66-9.38 9.25-12.41 11.19-5.16 14.04-5.68z" fill="#1d1d1b"/>

<path d="m36.37 7.86c.19 0 3.41 3.28 4.19 3.75s1 .78 1 1.37a11.82 11.82 0 0 0 -.19 3 7.12 7.12 0 0 0 .25 1.13 3.31 3.31 0 0 0 -.94 2.31c0 1.5.35 2.31 1.38 2.44a2.62 2.62 0 0 0 2.12-.94 3.29 3.29 0 0 0 .69-1.19s1.56 1.13 1.69 1.88-.82 4.43 0 5.12 3.44 2.75 3.5 3.53a9.73 9.73 0 0 1 -.38 2.35 2.9 2.9 0 0 0 -2.31 1.28 6.66 6.66 0 0 0 -1.28 3.65c0 .91-.28 1.82.53 3s1.19 1.29 1.53 1.47.85.41.85.41a14.89 14.89 0 0 0 -1.66 2.41c0 .37.47 2.18.28 2.78a2.8 2.8 0 0 1 -.81 1.09s-.13-.78-1.25-.62a2.85 2.85 0 0 0 -2.13 1.4c-.15.44.66 2.16.35 2.56a8 8 0 0 1 -4.07 2.79 26 26 0 0 1 -5.87.18c-.84-.09-1.59-.12-1.59-.12a19 19 0 0 0 -2.66-4.13c-1.09-.93-2.81-.76-3.59-.76a21.44 21.44 0 0 1 -3.06.19 27.8 27.8 0 0 1 -7-9.25 21.49 21.49 0 0 1 -1.5-15.25c1.41-5.15 6.09-10 9.5-12.56a39.59 39.59 0 0 1 12.43-5.27z" fill="#e6e4da"/>

<path d="m42.25 18.2a8.3 8.3 0 0 1 1.46 1 2.92 2.92 0 0 1 -.71 1.25c-.44.31-1 .66-1.32.22s-.06-2.38.57-2.47z" fill="#ffffff"/>

<path d="m30.59 20.29c2.5-.36 4.59 1.72 5.44 4.94a5.3 5.3 0 0 1 -4.44 6.6 6.1 6.1 0 0 1 -6.63-4c-1.03-2.72.5-6.83 5.63-7.54z" fill="#1d1d1b"/>

<path d="m30.56 22c1.44-.09 3.25.72 3.72 3.44s-1 4.28-2.63 4.53-3.94 0-4.72-2.41.07-5.39 3.63-5.56z" fill="#ffffff"/>

<path d="m21.31 19.11c.23-.07.72.75.72.75a9.54 9.54 0 0 0 -2.75 3.56c-1 2.28-1 3.41-1.22 3.53s-.88.06-.88-.09a9.51 9.51 0 0 1 1.28-4c1.16-1.97 1.88-3.47 2.85-3.75z" fill="#1d1d1b"/>

<path d="m19.25 33.54c1.52-.46 2.12 1.07 2.06 2.1a1.89 1.89 0 0 1 -2.56 1.59c-1.29-.56-2.35-2.81.5-3.69z" fill="#1d1d1b"/>

<g fill="#ffffff">

<path d="m19.28 34.45c.53-.31 1.22.34 1.06 1.06a.91.91 0 0 1 -1.34.72c-.63-.23-1-1.03.28-1.78z"/>

<path d="m49.06 33.51c.21-.13.44.28.31.66s-.94 1.28-.59 2.34 1.34 1.91 1.43 2.75.16 1-.06 1.44-.31.81-.56.81a2.93 2.93 0 0 1 -2.34-1.93c-.47-1.58-.57-4.58 1.81-6.07z"/>

<path d="m44.46 49.48a1.74 1.74 0 0 1 1.5-.62c.16.09.29 0 .22.25a6.75 6.75 0 0 1 -1.06 1.47c-.31.28-.47.65-.59.43a2.31 2.31 0 0 1 -.07-1.53z"/>

<path d="m24.71 51.33a4.35 4.35 0 0 1 3.94.21c1.31 1 2.72 3.22 2.35 3.29a7.68 7.68 0 0 1 -3.88-1.54c-1.81-1.29-2.5-1.81-2.41-1.96z"/>

</g>

<path d="m25.25 40.79c.25.19 1.75 3 1.56 3.19s-.19.31-.35.22a16.12 16.12 0 0 1 -1.84-3c.09-.2.63-.41.63-.41z" fill="#1d1d1b"/>

<path d="m23.37 41.79a18 18 0 0 1 1.91 3.72c-.16.16-.35.41-.44.32a27.79 27.79 0 0 1 -2.19-3.83 1.08 1.08 0 0 1 .72-.21z" fill="#1d1d1b"/>

<path d="m20.53 42.61c0-.21 1-.32 1.15-.19a25.06 25.06 0 0 1 1.75 3.72c-.06.15-.09.4-.34.28a24.18 24.18 0 0 1 -2.56-3.81z" fill="#1d1d1b"/>

</svg>
<svg class="sun" version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" 
	  viewBox="0 0 64 64" >
<g>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M32,14.002c-9.941,0-18,8.059-18,18s8.059,18,18,18
		s18-8.059,18-18S41.941,14.002,32,14.002z M32,48.002c-8.837,0-16-7.164-16-16s7.163-16,16-16s16,7.164,16,16
		S40.837,48.002,32,48.002z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M32,20.002c-0.553,0-1,0.447-1,1s0.447,1,1,1
		c5.522,0,10,4.477,10,10c0,0.553,0.447,1,1,1s1-0.447,1-1C44,25.375,38.627,20.002,32,20.002z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M63,31H53c-0.553,0-1,0.447-1,1s0.447,1,1,1h10
		c0.553,0,1-0.447,1-1S63.553,31,63,31z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M11.457,36.47l-3.863,1.035c-0.534,0.144-0.851,0.692-0.707,1.226
		c0.143,0.533,0.69,0.85,1.225,0.706l3.863-1.035c0.533-0.143,0.85-0.69,0.707-1.225C12.539,36.644,11.99,36.327,11.457,36.47z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M49.32,22c0.277,0.479,0.888,0.643,1.367,0.366l8.66-5
		c0.479-0.276,0.643-0.888,0.365-1.366c-0.275-0.479-0.887-0.642-1.365-0.365l-8.66,5C49.208,20.912,49.045,21.521,49.32,22z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M17.858,46.143c-0.39-0.391-1.023-0.389-1.414,0l-2.828,2.828
		c-0.391,0.391-0.39,1.025,0.001,1.415c0.39,0.391,1.022,0.39,1.413-0.001l2.828-2.828C18.249,47.168,18.249,46.534,17.858,46.143z"
		/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M42,14.68c0.479,0.276,1.09,0.113,1.367-0.366l5-8.66
		C48.644,5.175,48.48,4.563,48,4.287c-0.478-0.276-1.088-0.112-1.365,0.366l-4.999,8.661C41.358,13.793,41.522,14.403,42,14.68z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M26.824,51.318c-0.532-0.143-1.08,0.176-1.225,0.707l-1.035,3.863
		c-0.143,0.535,0.176,1.083,0.709,1.226c0.533,0.144,1.08-0.173,1.223-0.708l1.035-3.863C27.676,52.012,27.359,51.463,26.824,51.318
		z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M32,12c0.554,0,1.001-0.446,1.002-1V1c0-0.553-0.447-1-1.002-1
		c-0.551,0-0.998,0.447-0.999,1l0.001,10C31.002,11.553,31.449,12,32,12z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M38.402,52.025c-0.141-0.532-0.689-0.85-1.225-0.707
		c-0.533,0.143-0.848,0.692-0.707,1.225l1.035,3.863c0.144,0.535,0.693,0.85,1.227,0.707s0.849-0.689,0.705-1.225L38.402,52.025z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M20.637,14.312c0.275,0.479,0.887,0.643,1.363,0.367
		c0.48-0.277,0.645-0.887,0.368-1.367l-5-8.66C17.092,4.174,16.48,4.01,16,4.287c-0.477,0.275-0.641,0.887-0.365,1.365
		L20.637,14.312z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M47.558,46.142c-0.388-0.39-1.022-0.39-1.414,0
		c-0.391,0.39-0.388,1.024,0,1.414l2.828,2.828c0.392,0.392,1.025,0.389,1.415-0.001c0.391-0.39,0.391-1.021-0.001-1.413
		L47.558,46.142z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M4.654,17.365l8.662,4.999c0.477,0.276,1.088,0.113,1.363-0.364
		c0.277-0.479,0.115-1.09-0.364-1.367l-8.661-5C5.176,15.356,4.564,15.52,4.287,16C4.013,16.477,4.176,17.089,4.654,17.365z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M52.027,38.4l3.863,1.035c0.535,0.145,1.082-0.176,1.225-0.709
		c0.144-0.532-0.172-1.079-0.707-1.223l-3.863-1.035c-0.531-0.145-1.081,0.173-1.225,0.707C51.176,37.709,51.496,38.256,52.027,38.4
		z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M12,32c0.001-0.554-0.445-1-0.998-1.002L1,31
		c-0.552,0-1,0.445-1,1c0.001,0.551,0.448,1,1.001,1l10.001-0.002C11.553,32.998,12.001,32.552,12,32z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M52.545,27.529l3.863-1.035c0.535-0.143,0.85-0.693,0.706-1.227
		c-0.142-0.531-0.688-0.848-1.224-0.705l-3.863,1.035c-0.533,0.141-0.85,0.691-0.707,1.225
		C51.461,27.356,52.012,27.67,52.545,27.529z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M14.68,42c-0.275-0.48-0.886-0.644-1.365-0.368l-8.661,5.002
		C4.176,46.91,4.01,47.52,4.287,48c0.277,0.477,0.889,0.641,1.367,0.365l8.66-5.002C14.791,43.088,14.957,42.479,14.68,42z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M46.144,17.856c0.389,0.392,1.022,0.388,1.414,0l2.828-2.828
		c0.392-0.392,0.39-1.024-0.002-1.415c-0.388-0.39-1.021-0.391-1.412,0.001l-2.828,2.828C45.752,16.83,45.754,17.466,46.144,17.856z
		"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M22,49.32c-0.479-0.277-1.088-0.113-1.365,0.364l-5,8.663
		c-0.275,0.478-0.115,1.088,0.365,1.365c0.479,0.274,1.09,0.11,1.367-0.367l4.998-8.662C22.641,50.207,22.48,49.597,22,49.32z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M37.178,12.68c0.531,0.145,1.078-0.176,1.225-0.707l1.035-3.863
		c0.143-0.535-0.176-1.083-0.709-1.225c-0.531-0.144-1.08,0.172-1.223,0.707l-1.035,3.863C36.324,11.986,36.645,12.536,37.178,12.68
		z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M32,52c-0.553-0.002-0.998,0.446-1,0.998l0.002,10.004
		C31.002,63.552,31.445,64,32,64c0.553,0,1-0.449,1.001-1l-0.003-10.002C32.998,52.447,32.555,52,32,52z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M25.6,11.973c0.139,0.533,0.691,0.85,1.225,0.707
		c0.532-0.141,0.846-0.691,0.707-1.225l-1.035-3.863c-0.145-0.535-0.693-0.851-1.227-0.706c-0.531,0.142-0.85,0.688-0.705,1.224
		L25.6,11.973z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M43.363,49.687c-0.275-0.478-0.883-0.644-1.363-0.365
		c-0.479,0.274-0.641,0.885-0.367,1.364l5.004,8.661c0.275,0.478,0.883,0.644,1.363,0.366c0.479-0.277,0.642-0.889,0.367-1.367
		L43.363,49.687z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M16.443,17.856c0.387,0.394,1.023,0.39,1.414,0
		c0.391-0.388,0.387-1.021,0-1.414l-2.828-2.828c-0.393-0.392-1.025-0.39-1.415,0.002c-0.39,0.388-0.392,1.021,0.001,1.412
		L16.443,17.856z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M59.348,46.633l-8.663-4.997
		c-0.478-0.276-1.087-0.116-1.363,0.366c-0.278,0.477-0.112,1.086,0.364,1.364l8.664,4.999c0.477,0.275,1.086,0.115,1.363-0.365
		C59.988,47.521,59.824,46.91,59.348,46.633z"/>
	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M11.974,25.599L8.11,24.563c-0.536-0.144-1.083,0.175-1.225,0.708
		c-0.144,0.531,0.171,1.08,0.707,1.225l3.863,1.034c0.531,0.146,1.081-0.175,1.225-0.707C12.825,26.293,12.505,25.746,11.974,25.599
		z"/>
</g>
</svg>
          </label>
          <input type="checkbox" checked={darkMode} onChange={handleThemeToggle} id="darkmode-toggle" />
          <span className="slider"></span>
        </label>
      </div>

<header className="App-header">
        <h1>🌱 Smart Pot Dashboard</h1>
        <h2>Live Humidity: {humidity !== null ? `${humidity}%` : 'Waiting for data...'}</h2>

        <div className="graph-threshold-container">
          <div className="graph-container">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="threshold-control">
            <div className="pump-threshold">
              <h3>Pump Threshold:</h3>
              <h4>{threshold}%</h4>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={handleThresholdChange}
              className="slider-control"
            />
          </div>
        </div>

        <h2>Recent Readings (Last 50)</h2>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')}>Timestamp {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? ' - Oldest' : ' - Latest') : ''}</th>
              <th onClick={() => handleSort('value')}>Humidity (%) {sortConfig.key === 'value' ? (sortConfig.direction === 'asc' ? ' - Lowest' : ' - Highest') : ''}</th>
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


