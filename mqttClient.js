import mqtt from 'mqtt';

let client = null;
let dataListeners = [];
let sosListeners = [];

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
  if (client && client.connected) return;

  client = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    reconnectPeriod: 1000,
  });

  client.on('connect', () => {
    console.log('✅ MQTT connected');

    [TOPIC_DATA, TOPIC_SOS].forEach((topic) => {
      client.subscribe(topic, (err) => {
        if (!err) console.log(`📡 Subscribed to ${topic}`);
      });
    });
  });

  client.on('message', (topic, message) => {
    const msg = message.toString();

    if (topic === TOPIC_DATA) {
      const parsed = parseHelmetData(msg);
      if (parsed) {
        dataListeners.forEach((cb) => cb(parsed));
      }
    } else if (topic === TOPIC_SOS) {
      sosListeners.forEach((cb) => cb(msg));
    }
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
  });
};

// 🧩 ลงทะเบียนรับข้อมูลหมวก
export const onMQTTMessage = (callback) => {
  dataListeners.push(callback);
};

// 🧩 ลงทะเบียนรับข้อความ SOS
export const onSOSMessage = (callback) => {
  sosListeners.push(callback);
};

// ❌ ตัดการเชื่อมต่อ
export const disconnectMQTT = () => {
  if (client) {
    client.end();
    dataListeners = [];
    sosListeners = [];
    console.log('🔌 MQTT disconnected');
  }
};

// 🚨 ฟังก์ชันส่ง SOS ไปยัง topic soschannel
export const publishSOS = (hatId) => {
  if (client && client.connected) {
    client.publish(TOPIC_SOS, hatId.toString());
    console.log(`📤 Sent SOS for hatId: ${hatId}`);
  } else {
    console.error('❌ MQTT client not connected, cannot send SOS');
  }
};
