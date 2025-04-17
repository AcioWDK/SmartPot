#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "meh";
const char* password = "okwhatever";

const char* websocket_server_host = "192.168.1.246"; // CHANGE to your server IP
const uint16_t websocket_server_port = 3000;

const int pumpPin = 33;
bool pumpState = false;
unsigned long lastPumpChange = 0;
const unsigned long minPumpInterval = 5000;

const int humidityPin = 34;
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
    int humidity = random(30, 80);  // Fake humidity value
    String message = String(humidity);
    webSocket.sendTXT(message);
    Serial.println("Sending humidity: " + message);

        if (humidity < humidityThreshold ) {
      digitalWrite(pumpPin, LOW); 
      Serial.println("Pump ON");
    }else
    {
      digitalWrite(pumpPin, HIGH); 
      Serial.println("Pump OFF");  
    }

  }

  // unsigned long now = millis();
  // if (humidityPercent < humidityThreshold && !pumpState && (now - lastPumpChange >= minPumpInterval)) {
  //   digitalWrite(pumpPin, LOW); 
  //   pumpState = true;
  //   lastPumpChange = now;

  //   Serial.println("Pump ON");
  // }

  // if (humidityPercent >= humidityThreshold && pumpState && (now - lastPumpChange >= minPumpInterval)) {
  //   digitalWrite(pumpPin, HIGH); 
  //   pumpState = false;
  //   lastPumpChange = now;
  //   Serial.println("Pump OFF");
  // }

}

