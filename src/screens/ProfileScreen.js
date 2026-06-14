import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customer, auth } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Edit fields
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');

  // Password change
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const u = JSON.parse(await AsyncStorage.getItem('user'));
        setUser(u);
        setName(u?.name || '');
        setPhone(u?.phone || '');
        setPlate(u?.plate || '');
        if (u?.plate) {
          const res = await customer.profile(u.plate);
          setProfile(res.data);
        }
      } catch (e) {
        console.log('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return;
    }
    setSaving(true);
    try {
      await customer.update({ name, phone, plate: plate.toUpperCase() });
      const updated = { ...user, name, phone, plate: plate.toUpperCase() };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      Alert.alert('✅ تم', 'تم تحديث بياناتك بنجاح');
    } catch (e) {
      Alert.alert('خطأ', e.response?.data?.msg || 'فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) {
      Alert.alert('خطأ', 'أدخل كلمة المرور القديمة والجديدة');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setPwdLoading(true);
    try {
      await auth.changePassword({ old_password: oldPwd, new_password: newPwd });
      Alert.alert('✅ تم', 'تم تغيير كلمة المرور بنجاح');
      setOldPwd(''); setNewPwd(''); setShowPwdForm(false);
    } catch (e) {
      Alert.alert('خطأ', e.response?.data?.msg || 'فشل تغيير كلمة المرور');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{name || 'مستخدم'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {profile && (
          <View style={styles.badgeRow}>
            {profile.is_vip && (
              <View style={[styles.badge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }]}>
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>👑 VIP</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}>
              <Text style={[styles.badgeText, { color: '#3b82f6' }]}>🔵 {profile.points} نقطة</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}>
              <Text style={[styles.badgeText, { color: '#10b981' }]}>✅ {profile.visits} زيارة</Text>
            </View>
          </View>
        )}
      </View>

      {/* Stats Row */}
      {profile && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.visits}</Text>
            <Text style={styles.statLabel}>الزيارات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>{profile.points}</Text>
            <Text style={styles.statLabel}>النقاط</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{profile.is_vip ? 'نعم' : 'لا'}</Text>
            <Text style={styles.statLabel}>عضو VIP</Text>
          </View>
        </View>
      )}

      {/* Edit Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تعديل البيانات الشخصية</Text>

        <Text style={styles.label}>الاسم الكامل</Text>
        <TextInput
          style={styles.input} value={name} onChangeText={setName}
          placeholder="أدخل اسمك" placeholderTextColor="#475569"
        />

        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input} value={phone} onChangeText={setPhone}
          placeholder="+20 xxxxxxxxxx" placeholderTextColor="#475569"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>لوحة السيارة</Text>
        <TextInput
          style={[styles.input, styles.plateInput]} value={plate}
          onChangeText={(t) => setPlate(t.toUpperCase())}
          placeholder="ABC-1234" placeholderTextColor="#475569"
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>💾 حفظ التغييرات</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Password Change */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowPwdForm(!showPwdForm)}
        >
          <Text style={styles.sectionTitle}>🔒 تغيير كلمة المرور</Text>
          <Text style={{ color: '#3b82f6', fontSize: 18 }}>{showPwdForm ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showPwdForm && (
          <View>
            <Text style={styles.label}>كلمة المرور القديمة</Text>
            <TextInput
              style={styles.input} value={oldPwd} onChangeText={setOldPwd}
              secureTextEntry placeholder="••••••••" placeholderTextColor="#475569"
            />
            <Text style={styles.label}>كلمة المرور الجديدة</Text>
            <TextInput
              style={styles.input} value={newPwd} onChangeText={setNewPwd}
              secureTextEntry placeholder="••••••••" placeholderTextColor="#475569"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#7c3aed' }]}
              onPress={handleChangePassword} disabled={pwdLoading}
            >
              {pwdLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>تغيير كلمة المرور</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Last visit */}
      {profile?.last_visit && (
        <View style={styles.lastVisit}>
          <Text style={styles.lastVisitText}>آخر زيارة: {profile.last_visit}</Text>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },

  avatarSection: { alignItems: 'center', paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 15, elevation: 8,
  },
  avatarText:  { color: '#fff', fontSize: 36, fontWeight: '900' },
  userName:    { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userEmail:   { color: '#64748b', fontSize: 13, marginBottom: 12 },
  badgeRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeText:   { fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 18,
    padding: 20, marginHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center',
  },
  statItem:   { alignItems: 'center' },
  statValue:  { color: '#3b82f6', fontSize: 24, fontWeight: '900' },
  statLabel:  { color: '#64748b', fontSize: 12, marginTop: 4 },
  statDivider:{ width: 1, height: 40, backgroundColor: '#334155' },

  section: {
    backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#334155',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:  { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  label:         { color: '#94a3b8', fontSize: 13, marginBottom: 6, textAlign: 'right' },
  input: {
    backgroundColor: '#0f172a', color: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#334155', textAlign: 'right',
  },
  plateInput: { color: '#f59e0b', fontWeight: '700', letterSpacing: 2, fontSize: 18, textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#3b82f6', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  lastVisit:     { marginHorizontal: 16, marginBottom: 8 },
  lastVisitText: { color: '#475569', fontSize: 12, textAlign: 'center' },
});
