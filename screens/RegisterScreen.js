import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../components/UIComponents';
import { theme } from '../theme';
import * as Animatable from 'react-native-animatable';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    if (!username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (username.length < 3) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    }
    
    if (!password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '🎉 สมัครสมาชิกสำเร็จ',
        'ยินดีต้อนรับเข้าสู่ระบบ Smart Helmet',
        [{
          text: 'ดำเนินการต่อ',
          onPress: () => navigation.replace('Home')
        }]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={theme.colors.gradient.secondary}
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
            {/* Header */}
            <Animatable.View animation="fadeInDown" duration={1000} style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text.white} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Ionicons name="person-add" size={40} color={theme.colors.secondary} />
                </View>
                <Text style={styles.logoTitle}>สมัครสมาชิก</Text>
                <Text style={styles.logoSubtitle}>เข้าร่วมระบบตรวจสอบความปลอดภัย</Text>
              </View>
            </Animatable.View>

            {/* Registration Form */}
            <Animatable.View animation="fadeInUp" delay={300} duration={1000}>
              <Card style={styles.registerCard}>
                <Text style={styles.title}>สร้างบัญชีใหม่</Text>
                <Text style={styles.subtitle}>กรอกข้อมูลเพื่อเริ่มใช้งานระบบ</Text>

                <Input
                  label="อีเมล"
                  placeholder="กรอกที่อยู่อีเมล"
                  icon="mail-outline"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: null }));
                    }
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

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

                <Input
                  label="ยืนยันรหัสผ่าน"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  icon="lock-closed-outline"
                  rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  error={errors.confirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Button
                  title="สมัครสมาชิก"
                  onPress={handleRegister}
                  loading={loading}
                  icon="person-add-outline"
                  style={{ marginTop: theme.spacing.lg }}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>หรือ</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginLinkText}>
                    มีบัญชีอยู่แล้ว? 
                    <Text style={styles.loginLinkHighlight}>ลงชื่อเข้าใช้</Text>
                  </Text>
                </TouchableOpacity>
              </Card>
            </Animatable.View>
            
            {/* Terms and Privacy */}
            <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={styles.termsContainer}>
              <Text style={styles.termsText}>
                การสมัครสมาชิกแสดงว่าคุณยอมรับ
                <Text style={styles.termsLink}> เงื่อนไขการใช้งาน </Text>
                และ
                <Text style={styles.termsLink}> นโยบายความเป็นส่วนตัว</Text>
              </Text>
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
    padding: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.xl
  },
  headerContainer: {
    marginBottom: theme.spacing.xl
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg
  },
  logoContainer: {
    alignItems: 'center'
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  registerCard: {
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
  },
  loginLink: {
    alignItems: 'center',
    padding: theme.spacing.sm
  },
  loginLinkText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center'
  },
  loginLinkHighlight: {
    color: theme.colors.secondary,
    fontWeight: '600'
  },
  termsContainer: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md
  },
  termsText: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20
  },
  termsLink: {
    color: theme.colors.text.white,
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});
