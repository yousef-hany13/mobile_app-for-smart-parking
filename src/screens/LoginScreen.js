import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, customer } from '../services/api';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isArabic, setIsArabic] = useState(true); // Language Toggle

  const lang = {
    title: isArabic ? 'تسجيل الدخول' : 'Sign In',
    subtitle: isArabic ? 'أهلاً بك مجدداً في نظام المواقف الذكي' : 'Welcome back to Smart Parking',
    emailPlaceholder: isArabic ? 'البريد الإلكتروني' : 'Email Address',
    passPlaceholder: isArabic ? 'كلمة المرور' : 'Password',
    loginBtn: isArabic ? 'دخول' : 'Login',
    forgotBtn: isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?',
    signupLink: isArabic ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Sign up",
    langToggle: isArabic ? 'English' : 'عربي',
    errorEmpty: isArabic ? 'برجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password',
    forgotAlertTitle: isArabic ? 'استعادة كلمة المرور' : 'Reset Password',
    forgotAlertMsg: isArabic ? 'سيتم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.' : 'A password reset link will be sent to your email.'
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert(isArabic ? 'خطأ' : 'Error', lang.errorEmpty);
    setLoading(true);
    try {
      // Use "email" not "username" for the web_login endpoint
      const res = await auth.login({ email: email, password });
      
      await AsyncStorage.setItem('token', res.data.access_token);
      
      try {
        const profileRes = await customer.profile(email);
        await AsyncStorage.setItem('user', JSON.stringify(profileRes.data));
      } catch (e) {
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user || { email, plate: email }));
      }
      
      route.params.onLoginSuccess();
    } catch (err) {
      Alert.alert(isArabic ? 'فشل الدخول' : 'Login Failed', isArabic ? 'البيانات غير صحيحة' : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPass = () => {
    Alert.alert(lang.forgotAlertTitle, lang.forgotAlertMsg);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity style={styles.langBtn} onPress={() => setIsArabic(!isArabic)}>
        <Text style={styles.langText}>🌐 {lang.langToggle}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🚗</Text>
        </View>

        <Text style={styles.title}>{lang.title}</Text>
        <Text style={styles.subtitle}>{lang.subtitle}</Text>

        <TextInput
          style={[styles.input, !isArabic && { textAlign: 'left' }]}
          placeholder={lang.emailPlaceholder}
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={[styles.input, !isArabic && { textAlign: 'left' }]}
          placeholder={lang.passPlaceholder}
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={handleForgotPass} style={styles.forgotContainer}>
          <Text style={styles.forgotText}>{lang.forgotBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{lang.loginBtn}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: 25 }}>
          <Text style={styles.linkText}>{lang.signupLink}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  langBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: '#1e293b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', zIndex: 10 },
  langText: { color: '#e2e8f0', fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', padding: 30, borderRadius: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  iconContainer: { alignSelf: 'center', backgroundColor: '#334155', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#3b82f6' },
  iconText: { fontSize: 35 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 35, textAlign: 'center' },
  input: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 12, padding: 18, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#334155', textAlign: 'right' },
  forgotContainer: { alignSelf: 'flex-start', marginBottom: 20 },
  forgotText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14 },
  button: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#93c5fd', textAlign: 'center', fontSize: 15, fontWeight: '600' }
});
