import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { auth } from '../services/api';

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', phone: '', plate: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isArabic, setIsArabic] = useState(true);

  const lang = {
    title: isArabic ? 'حساب جديد' : 'Create Account',
    name: isArabic ? 'الاسم بالكامل' : 'Full Name',
    phone: isArabic ? 'رقم الهاتف' : 'Phone Number',
    plate: isArabic ? 'رقم اللوحة (مثال: ABC-123)' : 'Plate Number (e.g. ABC-123)',
    email: isArabic ? 'البريد الإلكتروني' : 'Email Address',
    pass: isArabic ? 'كلمة المرور' : 'Password',
    btn: isArabic ? 'إنشاء الحساب' : 'Sign Up',
    link: isArabic ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Login',
    langToggle: isArabic ? 'English' : 'عربي',
    errEmpty: isArabic ? 'برجاء إدخال جميع البيانات المطلوبة' : 'Please fill all required fields',
    successTitle: isArabic ? 'تم بنجاح' : 'Success',
    successMsg: isArabic ? 'تم إنشاء الحساب، يرجى تسجيل الدخول' : 'Account created. Please login.',
    ok: isArabic ? 'حسناً' : 'OK'
  };

  const handleSignup = async () => {
    if (!form.name || !form.plate || !form.email || !form.password) {
      return Alert.alert(isArabic ? 'خطأ' : 'Error', lang.errEmpty);
    }
    setLoading(true);
    try {
      await auth.signup(form);
      Alert.alert(lang.successTitle, lang.successMsg, [
        { text: lang.ok, onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert(isArabic ? 'فشل التسجيل' : 'Signup Failed', err.response?.data?.msg || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setIsArabic(!isArabic)}>
          <Text style={styles.langText}>🌐 {lang.langToggle}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>{lang.title}</Text>
          
          <TextInput style={[styles.input, !isArabic && { textAlign: 'left' }]} placeholder={lang.name} placeholderTextColor="#64748b" onChangeText={(t) => setForm({...form, name: t})} />
          <TextInput style={[styles.input, !isArabic && { textAlign: 'left' }]} placeholder={lang.phone} placeholderTextColor="#64748b" keyboardType="phone-pad" onChangeText={(t) => setForm({...form, phone: t})} />
          <TextInput style={[styles.input, !isArabic && { textAlign: 'left' }]} placeholder={lang.plate} placeholderTextColor="#64748b" autoCapitalize="characters" onChangeText={(t) => setForm({...form, plate: t})} />
          <TextInput style={[styles.input, !isArabic && { textAlign: 'left' }]} placeholder={lang.email} placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setForm({...form, email: t})} />
          <TextInput style={[styles.input, !isArabic && { textAlign: 'left' }]} placeholder={lang.pass} placeholderTextColor="#64748b" secureTextEntry onChangeText={(t) => setForm({...form, password: t})} />

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{lang.btn}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 25 }}>
            <Text style={styles.linkText}>{lang.link}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  langBtn: { alignSelf: 'flex-end', backgroundColor: '#1e293b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  langText: { color: '#e2e8f0', fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', padding: 30, borderRadius: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 25, textAlign: 'center' },
  input: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 12, padding: 18, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#334155', textAlign: 'right' },
  button: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#93c5fd', textAlign: 'center', fontSize: 15, fontWeight: '600' }
});
