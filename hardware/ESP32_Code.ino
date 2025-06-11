#include <WiFi.h>
#include <PubSubClient.h> // Include the MQTT library


//------------------------------------------- GLOBALS START --------------------------------------------
// --- Your Hotspot Wi-Fi Credentials ---
const char* ssid = "Monkey";
const char* password = "poggers101";

// --- MQTT Broker Settings ---
// IMPORTANT: Use the raw hostname/IP, NOT https://
const char* mqtt_server = "innovatinsa.piwio.fr"; // Corrected broker address
const int mqtt_port = 1883;                     // Standard MQTT port (unencrypted)
const char* mqtt_client_id = "ESP32_Publisher"; // A unique ID for your ESP32
const char* mqtt_publish_topic = "skippy/sensors"; // Topic to publish to
//const char* mqtt_subscribe_topic = "esp32/output"; // Topic to subscribe to for control

WiFiClient espClient; // Create a WiFiClient object
PubSubClient client(espClient); // Create a PubSubClient object, passing the WiFiClient

// Variable to track time to record data
long duration = 15000; 

// Pins for button
int btnPin = 0;
int btnPresses = 0;

// Pins for ultrasound
int ultTrigPin = 4;
int ultEchoPin = 5;

float dist = 0;
int attractionID = 1;

//Global tracking what mode your in
int mode = 1;

char payloadToSend[128];
char date[24];

//------------------------------------------- GLOBALS END --------------------------------------------

// -------------------------- Functions ------------------------------
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect with your unique client ID
    // You can add username and password for brokers that require them:
    // client.connect(mqtt_client_id, "username", "password")
    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state()); // Print the MQTT connection state
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

float getDistance(){
  float distance = 0;
  float time = 0;
  digitalWrite(ultTrigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(ultTrigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(ultTrigPin, LOW);

  time = pulseIn(ultEchoPin, HIGH);
  distance = (time*.0343)/2;
  Serial.print("Distance: ");
  Serial.println(distance);
  return distance;
}

// -------------------------- End Functions --------------------------

void setup() {
  Serial.begin(115200);
  Serial.println();

  // --- 1. Connect to Wi-Fi ---
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int connectAttempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); // Shorter delay for quicker attempts
    Serial.print(".");
    connectAttempts++;
    if (connectAttempts > 60) { // Timeout after 30 seconds (500ms * 60)
      Serial.println("\nFailed to connect to hotspot. Restarting...");
      ESP.restart(); // Restart the ESP32 to try again
    }
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // --- 2. Configure MQTT Client ---
  client.setServer(mqtt_server, mqtt_port);

  // Configure Pins section
  pinMode(btnPin, INPUT_PULLUP);

  pinMode(ultTrigPin, OUTPUT);
  pinMode(ultEchoPin, INPUT);
}

void loop() {
  // Check MQTT connection and re-connect if needed
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // MUST be called frequently to maintain connection and process messages

  if(mode == 0){
    // Sensors Activated Mode
    // Gatherind Data
    long startTime = millis(); // Record the start time of the loop
    btnPresses =0;
    Serial.print("Detecting button presses...\n");
    while (millis() - startTime < duration) {
      // Code inside this loop will execute for approximately 15 seconds
      if(!digitalRead(btnPin)){
        btnPresses++;
      }
      Serial.print(".");
      delay(200); // Another small delay example
    }
    Serial.print("\n");

    Serial.print("Number of People Entered In Last 15 Seconds: ");
    Serial.print(btnPresses);
    Serial.print("\n");

    dist = getDistance();

    // Format and Publish
    sprintf(payloadToSend, "{\"attraction_id\": %d, \"count\": %d, \"distance\": %.2f}", attractionID, btnPresses, dist);

    Serial.print("Publishing message: \"");
    Serial.print(payloadToSend);
    Serial.print("\" to topic: ");
    Serial.println(mqtt_publish_topic);

    if (client.publish(mqtt_publish_topic, payloadToSend)) {
      Serial.println("Message published successfully.");
    } else {
      Serial.print("Failed to publish message. MQTT state: ");
      Serial.println(client.state());
    }

          // --- Serial Command Handling ---
    if (Serial.available() > 0) {
      String input = Serial.readStringUntil('\n'); // Read input until newline
      input.trim(); // Remove any whitespace
      if(input == "T"){ // Toggle
        mode = 1;
        Serial.print("\nSensors Deactivated.\n\n");
      }
      else if(input == "Off"){
        mode = 2;
        Serial.print("\nDevice Deactivated.\n\n");
      }
      else{
        int id = input.toInt(); // Convert to integer
        if (id >= 1 && id <= 30) {
          attractionID = id;
          Serial.print("Attraction ID updated to: ");
          Serial.println(attractionID);
        } else {
          Serial.println("Invalid input. Please enter a number between 1 and 30.");
        }
      }
    }

  }else if(mode == 1){
    // Create random data mode
    attractionID = random(1,31);
    dist = random(25000,40000) / 100.0;
    btnPresses = random (11,21);
    int hour = random(9,19);
    int minute = random(0,61);
    float second = (random(0, 60000) / 1000.0);
    sprintf(date, "2025-06-10 %d:%d:%.3f", hour, minute, second);
    sprintf(payloadToSend, "{\"attraction_id\": %d, \"count\": %d, \"distance\": %.2f, \"timestamp\": \"%s\"}", attractionID, btnPresses, dist, date);
    

    Serial.print("Publishing message: \"");
    Serial.print(payloadToSend);
    Serial.print("\" to topic: ");
    Serial.println(mqtt_publish_topic);

    if (client.publish(mqtt_publish_topic, payloadToSend)) {
      Serial.println("Message published successfully.");
    } else {
      Serial.print("Failed to publish message. MQTT state: ");
      Serial.println(client.state());
    }

    // --- Serial Command Handling ---
    if (Serial.available() > 0) {
      String input = Serial.readStringUntil('\n'); // Read input until newline
      input.trim(); // Remove any whitespace
      if (input == "T") {
        mode = 0;
        Serial.print("\nSensors Activated.\n\n");
      } else if(input == "Off") {
        mode = 2;
        Serial.print("\nDevice Deactivated.\n\n");
      }else{
        Serial.println("Invalid input. Input T to toggle between sensors or Off to turn off device.");
      }
    }
    delay(3000);
  }else{
    // OFF MODE
    if (Serial.available() > 0) {
      String input = Serial.readStringUntil('\n'); // Read input until newline
      input.trim(); // Remove any whitespace
      if (input == "On") {
        mode = 0;
        Serial.print("\nDevice Activated.\n\n");
      }
    }
    delay(1000);
  }
  
  // The client.connected() check in loop and subsequent reconnect()
  // largely covers Wi-Fi stability for MQTT.
  // If Wi-Fi drops, MQTT will disconnect, triggering reconnect, which handles Wi-Fi implicitly.
}