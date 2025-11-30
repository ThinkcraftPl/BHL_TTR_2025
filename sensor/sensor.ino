// #include <dht11.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>

#include <WebSocketsClient.h>


#include <esp_wifi.h>
#define trigPin 20
#define echoPin 21
#define DHT11PIN 2

WiFiMulti WiFiMulti;
WebSocketsClient webSocket;
// dht11 DHT11;

int _mavg [5];
bool calibrated = false;
#define DEVICE_ID 1
typedef struct message_to_base_station {
  bool request_calibration; // 1
  int deviceId; // 4
  int fill_level; // 4
  float temperature; // 4
  float humidity; // 4
  float pollution; // 4
  bool alarm; // 1
} message_to_base_station;

typedef struct message_from_base_station {
  int deviceId;
  float empty_distance;
  float full_distance;
} message_from_base_station;


message_from_base_station msg_in;

// void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {

//   Serial.print("\r\nLast Packet Send Status:\t");

//   Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");

// }
// void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
//   Serial.print("Bytes received: ");
//   Serial.println(len);
//   Serial.print("MESSAGE:");
//   for(int i = 0; i< 6; i++)
//     Serial.print(info->src_addr[i]);
//   for(int i = 0; i< len; i++)
//     Serial.print(data[i]);
//   Serial.println("");
  
//   memcpy(&msg_in, data, len);

//   calibrated=true;
// }


#define USE_SERIAL Serial

void hexdump(const void *mem, uint32_t len, uint8_t cols = 16) {
	const uint8_t* src = (const uint8_t*) mem;
	USE_SERIAL.printf("\n[HEXDUMP] Address: 0x%08X len: 0x%X (%d)", (ptrdiff_t)src, len, len);
	for(uint32_t i = 0; i < len; i++) {
		if(i % cols == 0) {
			USE_SERIAL.printf("\n[0x%08X] 0x%08X: ", (ptrdiff_t)src, i);
		}
		USE_SERIAL.printf("%02X ", *src);
		src++;
	}
	USE_SERIAL.printf("\n");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  int in_device_id = 1;
	switch(type) {
		case WStype_DISCONNECTED:
			USE_SERIAL.printf("[WSc] Disconnected!\n");
			break;
		case WStype_CONNECTED:
			USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);

			// send message to server when Connected
			webSocket.sendTXT("Connected");
			break;
		case WStype_TEXT:
			USE_SERIAL.printf("[WSc] get text: %s\n", payload);
			// send message to server
			// webSocket.sendTXT("message here");
			break;
		case WStype_BIN:
			USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
      USE_SERIAL.printf("%02x %02x %02x %02x\n", payload[0], payload[1], payload[2], payload[3]);
      memcpy(&in_device_id, payload, 4);
      USE_SERIAL.printf("Device id: %d\n", in_device_id);
      if(in_device_id == DEVICE_ID)
      {
        memcpy(&msg_in, payload, length);
        calibrated=true;
        USE_SERIAL.printf("Device id: %d\n", msg_in.deviceId);
        USE_SERIAL.printf("%f %f\n", msg_in.empty_distance, msg_in.full_distance);
      }


			// send data to server
			// webSocket.sendBIN(payload, length);
			break;
		case WStype_ERROR:			
		case WStype_FRAGMENT_TEXT_START:
		case WStype_FRAGMENT_BIN_START:
		case WStype_FRAGMENT:
		case WStype_FRAGMENT_FIN:
			break;
	}

}

const unsigned char mac[6] = {0x88, 0x56, 0xa6, 0x74, 0x5b, 0x18};

void setup() {
  Serial.begin (9600);
  pinMode(trigPin, OUTPUT); //Pin, do którego podłączymy trig jako wyjście
  pinMode(echoPin, INPUT); //a echo, jako wejście
  calibrated = false;
  msg_in.full_distance = -1;
  delay(1000);
	WiFiMulti.addAP("unable to identify", "123456789");
  while(WiFiMulti.run() != WL_CONNECTED) {
		delay(100);
	}
  Serial.println("WiFi connected");
  // server address, port and URL
	webSocket.begin("10.97.169.188", 3000, "/ws/base_station");

	// event handler
	webSocket.onEvent(webSocketEvent);

	// use HTTP Basic Authorization this is optional remove if not needed
	// webSocket.setAuthorization("user", "Password");

	// try ever 5000 again if connection has failed
	webSocket.setReconnectInterval(5000);
}

       //sprawdzenie stanu sensora, a następnie wyświetlenie komunikatu na monitorze szeregowym

int last_time = 0;
void loop() {  
  if(last_time + 1000 < millis())
  {

    message_to_base_station msg_out;
    
    msg_out.deviceId = DEVICE_ID;
    if(!calibrated)
    {
      msg_out.request_calibration = true;
    }
    else
    {
      msg_out.request_calibration = false;
      msg_out.fill_level = map(check_distance(), msg_in.empty_distance, msg_in.full_distance, 0, 100);
      msg_out.temperature = check_temperature();
      msg_out.humidity = check_humidity();
      msg_out.pollution = check_pollution();
      msg_out.alarm = check_fire();
      Serial.printf("Temp: %f Hum: %f\n", msg_out.temperature, msg_out.humidity);
    }
    webSocket.sendBIN((uint8_t*) &msg_out, sizeof(msg_out));
    Serial.println("Sent!");
    // esp_err_t result = esp_now_send(mac, (uint8_t *) &msg_out, 2);
    // if (result == ESP_OK) {
    //   Serial.println("Sent with success");
    // }
    // else {
    //   Serial.println("Error sending the data");
    // }
    last_time = millis();
  }
  // delay(10000);
  webSocket.loop();
} 

int check_distance()
{
  return distance();
}

float check_temperature()
{
  // return (float)DHT11.temperature;
  return 25;
}

float check_humidity()
{
  // return (float)DHT11.humidity;
  return 50;
}

float check_pollution()
{

return 1.0;
}

bool check_fire()
{
  if(check_temperature()>50)
    return true;
  return false;
}

int distance() {
  long czas, dystans;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  czas = pulseIn(echoPin, HIGH);
  dystans = czas / 58;

 // move_avg(_mavg, 5, dystans);
  return dystans;
}

int move_avg(int *a, int size, int new_value)
{
  int avg = 0; 

for(int i = 0; i<size; i++)
{
    a[i] = a[i+1];
    avg += a[i];
}
a[size-1] = new_value;
avg += new_value;
return avg/size;
}