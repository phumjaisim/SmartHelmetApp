import mqtt from 'mqtt';

let client = null;
let dataListeners = new Set();
let sosListeners = new Set();
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const MQTT_BROKER = 'ws://ionlypfw.thddns.net:2025';
const MQTT_USERNAME = 'smarthelmet';
const MQTT_PASSWORD = 'smarthelmet';
const TOPIC_DATA = 'data';
const TOPIC_SOS = 'soschannel';

// 🔍 ฟังก์ชันแยกข้อมูลจากข้อความ MQTT เป็น object
const parseHelmetData = (rawString) => {
  const parts = rawString.split(',');

  if (parts.length !== 7) {
    console.warn('⚠️ ข้อมูลผิดรูปแบบ:', rawString);
    return null;
  }

  return {
    hatId: parts[0],
    helmetStatus: parts[1],
    gForce: parseFloat(parts[2]),
    acceleration: parseFloat(parts[3]),
    latitude: parseFloat(parts[4]),
    longitude: parseFloat(parts[5]),
    heartRate: parseInt(parts[6]),
  };
};

// 🔌 เชื่อมต่อ MQTT
export const connectToMQTT = () => {
  if ((client && client.connected) || isConnecting) {
    console.log('🔄 MQTT already connected or connecting');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    isConnecting = true;
    
    client = mqtt.connect(MQTT_BROKER, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 1000,
      connectTimeout: 10000,
      keepalive: 30,
    });

    client.on('connect', () => {
      console.log('✅ MQTT connected');
      isConnecting = false;
      reconnectAttempts = 0;

      [TOPIC_DATA, TOPIC_SOS].forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (!err) {
            console.log(`📡 Subscribed to ${topic}`);
          } else {
            console.error(`❌ Failed to subscribe to ${topic}:`, err);
          }
        });
      });
      
      resolve();
    });

    client.on('message', (topic, message) => {
      const msg = message.toString();

      try {
        if (topic === TOPIC_DATA) {
          const parsed = parseHelmetData(msg);
          if (parsed) {
            dataListeners.forEach((cb) => {
              try {
                cb(parsed);
              } catch (error) {
                console.error('❌ Error in data listener:', error);
              }
            });
          }
        } else if (topic === TOPIC_SOS) {
          sosListeners.forEach((cb) => {
            try {
              cb(msg);
            } catch (error) {
              console.error('❌ Error in SOS listener:', error);
            }
          });
        }
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
      }
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      isConnecting = false;
      reject(err);
    });

    client.on('disconnect', () => {
      console.log('🔌 MQTT disconnected');
      isConnecting = false;
    });

    client.on('reconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnection attempts reached');
        client.end(true);
        isConnecting = false;
        return;
      }
      console.log(`🔄 MQTT reconnecting... (attempt ${reconnectAttempts})`);
    });
  });
};

// 🧩 ลงทะเบียนรับข้อมูลหมวก
export const onMQTTMessage = (callback) => {
  dataListeners.add(callback);
  return () => dataListeners.delete(callback); // Return cleanup function
};

// 🧩 ลงทะเบียนรับข้อความ SOS
export const onSOSMessage = (callback) => {
  sosListeners.add(callback);
  return () => sosListeners.delete(callback); // Return cleanup function
};

// ❌ ตัดการเชื่อมต่อ
export const disconnectMQTT = () => {
  if (client) {
    client.end(true);
    client = null;
    dataListeners.clear();
    sosListeners.clear();
    isConnecting = false;
    reconnectAttempts = 0;
    console.log('🔌 MQTT disconnected and cleaned up');
  }
};

// 📊 Get connection status
export const getMQTTStatus = () => {
  return {
    connected: client?.connected || false,
    connecting: isConnecting,
    reconnectAttempts,
  };
};

// 🚨 ฟังก์ชันส่ง SOS ไปยัง topic soschannel
export const publishSOS = (message = 'sos') => {
  if (client && client.connected) {
    client.publish(TOPIC_SOS, message.toString());
    console.log(`📤 Sent SOS message: ${message}`);
  } else {
    console.error('❌ MQTT client not connected, cannot send SOS');
    throw new Error('MQTT client not connected');
  }
};

// 🚨 ฟังก์ชันส่ง SOS สำหรับหมวกเฉพาะ
export const publishHelmetSOS = (hatId) => {
  if (client && client.connected) {
    client.publish(TOPIC_SOS, hatId.toString());
    console.log(`📤 Sent SOS for hatId: ${hatId}`);
  } else {
    console.error('❌ MQTT client not connected, cannot send SOS');
    throw new Error('MQTT client not connected');
  }
};
