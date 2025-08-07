import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // ใส่ logic ตรวจสอบผู้ใช้จริงที่นี่
    navigation.replace('Home'); // ไปหน้า Home หลังล็อกอินสำเร็จ
  };

  const handleForgotPassword = () => {
    alert('📧 รหัสผ่านจะถูกส่งไปยังอีเมลของคุณ (สมมุติ)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลงชื่อเข้าใช้</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.link}>ลืมรหัสผ่าน?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    borderBottomWidth: 1,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  link: {
    color: 'blue',
    marginBottom: 15,
    textAlign: 'right',
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
