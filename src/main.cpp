#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "meh";               
const char* password = "okwhatever";

const char* websocket_server_host = "192.168.1.246"; // server IP
const uint16_t websocket_server_port = 3000;

const int pumpPin = 33;
bool pumpState = false;
unsigned long lastPumpChange = 0;
unsigned long pumpStartTime = 0;
const unsigned long pumpDuration = 10000;      // run for 10 seconds 
const unsigned long minPumpInterval = 120000;  // every 2 minutes ( if all other conditions met )
int pumpRuns = 0;

const int humidityPin = 35;
const int dryValue = 4095;
const int wetValue = 1500;
int humidityThreshold = 40;

WebSocketsClient webSocket;
bool webSocketConnected = false;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  
  JsonDocument doc;

  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connected to server");
      webSocketConnected = true;
      break;
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected!");
      webSocketConnected = false;
      break;
    case WStype_TEXT: {
        Serial.printf("[WSc] Received text: %s\n", payload);
        DeserializationError error = deserializeJson(doc, payload);
        if (!error) {
          String type = doc["type"];
          if (type == "threshold") {
            int newThreshold = doc["value"];
            humidityThreshold = newThreshold;
            Serial.printf("New Pump Threshold: %d%%\n", humidityThreshold);
          }
        }
        break;
    }
    case WStype_ERROR:
      Serial.println("[WebSocket] Error!");
      webSocketConnected = false;
      break;
  }
}

void setup() {
  Serial.begin(921600); 
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, HIGH);
  
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected");

  webSocket.begin(websocket_server_host, websocket_server_port, "/esp32");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Reconnect every 5s if disconnected
}


void loop() {
  webSocket.loop();
  
  int sensorValue = analogRead(humidityPin);
  float humidityPercent = (float)(sensorValue - dryValue) * 100.0 / (wetValue - dryValue);
  humidityPercent = constrain(humidityPercent, 0, 100);


  // Send humidity every 5 seconds only if connected
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000 && webSocketConnected) {
    lastSend = millis();
    // int humidity = random(30, 80);  // Fake humidity value
    String message = String(humidityPercent);
    webSocket.sendTXT(message);
    Serial.println("Sending humidity: " + message);
  }


//Pump logic
  
  unsigned long now = millis();
  
  // if pump is OFF, conditions met AND 5 minutes passed
  if (!pumpState && 0 < humidityPercent && humidityPercent < humidityThreshold && (now - lastPumpChange >= minPumpInterval)) {
    digitalWrite(pumpPin, LOW); // Turn pump ON
    pumpState = true;
    pumpStartTime = now;
    Serial.print("Pump ON - ");
    pumpRuns ++;
    Serial.println(pumpRuns);
  }

  // if pump is ON and 10 seconds have passed, turn it OFF
  if (pumpState && (now - pumpStartTime >= pumpDuration)) {
    digitalWrite(pumpPin, HIGH); // Turn pump OFF
    pumpState = false;
    lastPumpChange = now;
    Serial.println("Pump OFF");
  }
  
}

