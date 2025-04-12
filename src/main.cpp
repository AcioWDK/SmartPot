#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid = "meh";
const char* password = "okwhatever";

const char* websocket_server_host = "192.168.1.246"; // CHANGE to your computer IP
const uint16_t websocket_server_port = 3000;

WebSocketsClient webSocket;
bool webSocketConnected = false;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connected to server");
      webSocketConnected = true;
      break;
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected!");
      webSocketConnected = false;
      break;
    case WStype_TEXT:
      Serial.printf("[WebSocket] Received text: %s\n", payload);
      break;
    case WStype_ERROR:
      Serial.println("[WebSocket] Error!");
      webSocketConnected = false;
      break;
  }
}

void setup() {
  Serial.begin(921600); // HIGH speed
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected");

  webSocket.begin(websocket_server_host, websocket_server_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Reconnect every 5s if disconnected
}

void loop() {
  webSocket.loop();

  // Send fake humidity every 5 seconds only if connected
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000 && webSocketConnected) {
    lastSend = millis();
    int humidity = random(30, 80);  // Fake humidity value
    String message = String(humidity);
    webSocket.sendTXT(message);
    Serial.println("Sending humidity: " + message);
  }
}
