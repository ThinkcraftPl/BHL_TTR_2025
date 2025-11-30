#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>

void readMacAddress(){
  uint8_t baseMac[6];
  esp_err_t ret = esp_wifi_get_mac(WIFI_IF_STA, baseMac);
  if (ret == ESP_OK) {
    Serial.printf("%02x:%02x:%02x:%02x:%02x:%02x\n",
                  baseMac[0], baseMac[1], baseMac[2],
                  baseMac[3], baseMac[4], baseMac[5]);
  } else {
    Serial.println("Failed to read MAC address");
  }
}

typedef struct message_to_base_station {
  bool request_calibration;
  int fill_level;
  float temperature;
  float humidity;
  float pollution;
  bool alarm;
} message_to_base_station;

typedef struct message_from_base_station {
  float empty_distance;
  float full_distance;
} message_from_base_station;


void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {

  Serial.print("\r\nLast Packet Send Status:\t");

  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");

}

void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  Serial.print("Bytes received: ");
  Serial.println(len);
  Serial.print("MESSAGE:");
  for(int i = 0; i< 6; i++)
    Serial.print(info->src_addr[i]);
  for(int i = 0; i< len; i++)
    Serial.print(data[i]);
  Serial.println("");
}

void setup() {
  Serial.begin(9600);

  delay(1000);

  WiFi.mode(WIFI_STA);

  Serial.print("[DEFAULT] ESP32 Board MAC Address: ");
  readMacAddress();
  Serial.println(sizeof(message_from_base_station));
  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {

    Serial.println("Error initializing ESP-NOW");
    return;

  }
  const unsigned char mac[6] = {0x1c, 0xdb, 0xd4, 0x33, 0x38, 0x38};
  esp_now_peer_info_t peerInfo;
  // Register peer
  // memcpy(peerInfo.peer_addr, mac, 6);
  // peerInfo.channel = 0;  
  // peerInfo.encrypt = false;
  // // Add peer        
  // if (esp_now_add_peer(&peerInfo) != ESP_OK){
  //   Serial.println("Failed to add peer");
  // } 

  esp_now_register_recv_cb(OnDataRecv);
}

void loop() {
  while(!Serial.available()) {delay(100);}
  unsigned char mac[6] = {0x1c, 0xdb, 0xd4, 0x33, 0x38, 0x38};
  Serial.readBytes(mac, 6);
  message_from_base_station message;
  Serial.readBytes((uint8_t*)&message, sizeof(message_from_base_station));
  Serial.read();
  esp_now_peer_info_t peerInfo;
  // Register peer
  memcpy(peerInfo.peer_addr, mac, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;
  for(int i = 0; i<6; i++)
    Serial.print(mac[i]);
  Serial.println("");
  Serial.println(message.empty_distance);
  Serial.println(message.full_distance);
  // Add peer        
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Failed to add peer");
  } 
  else {
    esp_err_t result = esp_now_send(mac, (uint8_t *) &message, sizeof(message));
    if (result == ESP_OK) {
      Serial.println("Sent with success");
    }
    else {
      Serial.println("Error sending the data");
    }
    if (esp_now_del_peer(mac) != ESP_OK){
      Serial.println("Failed to remove peer");
      return;
    }
  }
}
