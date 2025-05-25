Physical components:

- esp32 devkit
- 5v relay
- resistive humidity sensor
- 3-6v water pump




MC ( esp32 )
    -> reads humidity from sensor 
    -> gets current treshold from server
    -> sends humidity to server 
    -> control pump
    -> receives pump threshold updates from server 

       ^
       |    webSocket
       v

server ( Node.js )

    -> stores humidity in DB (SQLite) ( at http://localhost:3000/api/readings) 
    -> stores current threshold in threshold.json and at http://localhost:3000/api/threshold
    -> sends current humidity to React App 
    -> listens for threshold changes from React App 

       ^
       |    socket.io
       v

React webapp
    -> displays live humidity chart 
    -> sends new threshold value via slider 
    -> displays latest readings table ( from http://localhost:3000/api/readings ) 
    -> get last set threshold from http://localhost:3000/api/threshold






MC Detailed:

setup:

- connect to wifi
- connect to webSocket server
- set default threshold

loop:

- read humidity sensor
- send value to server via websocket
- listens to new threshold updates
- handles the pump accordingly






Wiring

humidity sensor:
-> vcc to esp32 3v 
-> DO to esp G35 
-> gnd to ground 

relay:
-> vcc to esp32 3v  
-> gnd to ground  
-> IN to G33  

-> COM to 5v power supply  
-> NO to pump vcc

esp32:
- 5vcc to external 5v power supply
- gnd to gnd
- pin33 to pump IN
- pin35 to humidity sensor DO





                        +------------+
                        |            |
                        |            |
                        |   Sensor   |
                        |            |
                        +------------+

                             |
                             |  Humidity
                             |
                             v

                        +------------+         WebSocket          +------------+         Socket.IO             +------------+
                        |            |--------------------------->|            |<----------------------------->|            |
                        |            |         localhost          |   Server   |         localhost             | React App  |
                        |   ESP32    |           /300             | (Backend)  |           /5000               | (Frontend) |
                        |            |<---------------------------|   NodeJS   |------------------------------>|            |
                        +------------+         WebSocket          +------------+         Socket.IO             +------------+

                             |
                             |  HIGH/LOW
                             |
                             v                        
                        +------------+
                        |            |
                        |            |
                        |   Pump     |
                        |            |
                        +------------+
                                                






+--------------------+
|    ESP32 Setup     |
+--------------------+
         |
         v
+--------------------+
| Connect to Wi-Fi   |
+--------------------+
         |
         v
+--------------------+
| Retrieve Threshold |
|    from server     |
+--------------------+
         |
         v
+--------------------+
| Start Sensor Timer |
+--------------------+
         |
         v
+--------------------+
| Read Sensor Data   |
+--------------------+
         |
         v
+--------------------+
|   Compare with     |
|   Threshold and    |
|   activate pump    |
+--------------------+
         |
         v
+--------------------+
| Send Data to       |
| Server via HTTP    |
+--------------------+
         |
         v
+--------------------+
| Wait for Next Read |
+--------------------+
         |
         v
     (Loop Back)



