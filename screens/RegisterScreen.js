import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // ใส่ logic สมัครสมาชิกจริงที่นี่
    alert('✅ สมัครสมาชิกเรียบร้อยแล้ว (สมมุติ)');
    navigation.replace('Home'); // ไปหน้า Home หลังสมัครเสร็จ
  };

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Modern Header */}
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>สมัครสมาชิก</Text>
            <Text style={styles.headerSubtitle}>Create your account</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>สมัคร</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>มีบัญชีอยู่แล้ว? กลับไปลงชื่อเข้าใช้</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  
  // Modern Header
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e8eaf6',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40, // Same as back button to center title
  },
  
  // Form Container
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  
  // Input Styles
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Button Styles
  button: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Link Styles
  link: {
    color: '#1976d2',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
