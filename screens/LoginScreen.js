import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../components/UIComponents';
import { theme } from '../theme';
import * as Animatable from 'react-native-animatable';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    }
    
    if (!password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Home');
    }, 1500);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      '🔑 ลืมรหัสผ่าน',
      'ลิงค์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลของคุณ',
      [{ text: 'ตกลง', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View animation="fadeInUp" duration={1000} style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="construct" size={60} color={theme.colors.primary} />
              </View>
              <Text style={styles.logoTitle}>Smart Helmet</Text>
              <Text style={styles.logoSubtitle}>ระบบตรวจสอบความปลอดภัย</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={300} duration={1000}>
              <Card style={styles.loginCard}>
                <Text style={styles.title}>ลงชื่อเข้าใช้</Text>
                <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อตรวจสอบความปลอดภัยของพนักงาน</Text>

                <Input
                  label="ชื่อผู้ใช้"
                  placeholder="กรอกชื่อผู้ใช้"
                  icon="person-outline"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: null }));
                    }
                  }}
                  error={errors.username}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="รหัสผ่าน"
                  placeholder="กรอกรหัสผ่าน"
                  icon="lock-closed-outline"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: null }));
                    }
                  }}
                  error={errors.password}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                  <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
                </TouchableOpacity>

                <Button
                  title="เข้าสู่ระบบ"
                  onPress={handleLogin}
                  loading={loading}
                  icon="log-in-outline"
                  style={{ marginTop: theme.spacing.md }}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>หรือ</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  title="สมัครสมาชิกใหม่"
                  onPress={() => navigation.navigate('Register')}
                  variant="outline"
                  icon="person-add-outline"
                />
              </Card>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium
  },
  logoTitle: {
    ...theme.typography.h1,
    color: theme.colors.text.white,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs
  },
  logoSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.white,
    textAlign: 'center',
    opacity: 0.9
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    ...theme.shadows.large
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md
  },
  forgotText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.text.light
  },
  dividerText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface
  }
});
