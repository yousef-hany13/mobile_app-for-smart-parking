import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parking, booking } from '../services/api';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';
import QRCode from 'react-native-qrcode-svg';

export default function DashboardScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const u = JSON.parse(await AsyncStorage.getItem('user'));
      setUser(u);
      
      const occRes = await parking.getPricing();
      setOccupancy(occRes.data);

      if (u?.plate) {
        const bkRes = await booking.list(u.plate);
        setMyBookings(bkRes.data);
      }
    } catch (e) {
      console.log('Error loading dash data', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    const socket = io(socketUrl);
    socket.on('occupancy_update', () => loadData());
    socket.on('new_booking', () => loadData());
    
    const unsubscribe = navigation.addListener('focus', () => loadData());
    return () => { socket.close(); unsubscribe(); };
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          route.params.onLogout();
        } 
      }
    ]);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً بك مجدداً،</Text>
          <Text style={styles.name}>{user?.name || user?.plate || 'ضيف'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={{color: '#ef4444', fontWeight: 'bold'}}>خروج 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Action Grid */}
      <View style={styles.actionGrid}>
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>🚘</Text>
          <Text style={styles.actionText}>سيارتي</Text>
          <Text style={styles.actionSub}>{user?.plate || '---'}</Text>
        </View>
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={styles.actionText}>المحفظة</Text>
          <Text style={styles.actionSub}>0.00 ج.م</Text>
        </View>
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>التنبيهات</Text>
          <Text style={styles.actionSub}>لا يوجد</Text>
        </View>
      </View>

      {/* Live Occupancy Widget */}
      {occupancy ? (
        <View style={styles.occCard}>
          <View style={styles.occRow}>
            <View>
              <Text style={styles.occTitle}>الأماكن المتاحة الآن</Text>
              <Text style={styles.occRate}>سعر الساعة: {occupancy.rate} ج.م</Text>
            </View>
            <Text style={[styles.occNumber, { color: occupancy.available_spots > 0 ? '#10b981' : '#ef4444' }]}>
              {occupancy.available_spots}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${occupancy.occupancy_pct}%`, backgroundColor: occupancy.available_spots > 10 ? '#3b82f6' : '#f59e0b' }]} />
          </View>
          <Text style={styles.occSub}>نسبة الإشغال: {occupancy.occupancy_pct}% {occupancy.emoji}</Text>
        </View>
      ) : (
         <ActivityIndicator size="large" color="#3b82f6" style={{marginVertical: 20}} />
      )}

      {/* Book Button */}
      <TouchableOpacity 
        style={[styles.bookBtn, occupancy?.available_spots === 0 && {backgroundColor: '#475569'}]} 
        onPress={() => navigation.navigate('Booking')}
        disabled={occupancy?.available_spots === 0}
      >
        <Text style={styles.bookBtnText}>
          {occupancy?.available_spots === 0 ? 'المواقف ممتلئة بالكامل ❌' : '+ حجز موقف مسبق ⚡'}
        </Text>
      </TouchableOpacity>

      {/* Bookings List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>حجوزاتي النشطة</Text>
        <Text style={styles.badge}>{myBookings.length}</Text>
      </View>

      {myBookings.map((bk) => (
        <View key={bk.id} style={styles.bkCard}>
          <View style={styles.bkHeader}>
            <Text style={styles.bkSpot}>الطابق {bk.floor} - موقف {bk.slot}</Text>
            <View style={[styles.statusBadge, {backgroundColor: bk.confirmed ? '#10b98120' : '#3b82f620'}]}>
              <Text style={{color: bk.confirmed ? '#10b981' : '#3b82f6', fontWeight: 'bold', fontSize: 12}}>
                {bk.confirmed ? 'مؤكد ✅' : 'قيد الانتظار ⏳'}
              </Text>
            </View>
          </View>
          <View style={styles.bkBody}>
            <View style={{flex: 1}}>
              <Text style={styles.bkTime}>⬇️ الوصول: {bk.arrive_time}</Text>
              <Text style={styles.bkTime}>⬆️ المغادرة: {bk.depart_time}</Text>
              <Text style={styles.bkPlate}>رقم الحجز: #{bk.id}</Text>
            </View>
            <View style={styles.qrContainer}>
              <QRCode value={`BOOKING|ID:${bk.id}|PLATE:${bk.plate}`} size={65} />
            </View>
          </View>
        </View>
      ))}
      
      {myBookings.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 40, marginBottom: 10}}>🪹</Text>
          <Text style={{color: '#94a3b8', fontSize: 16}}>لا توجد حجوزات نشطة حالياً</Text>
        </View>
      )}
      
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { fontSize: 14, color: '#94a3b8', marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '900', color: '#fff' },
  logoutBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: '#ef444440' },
  
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionItem: { backgroundColor: '#1e293b', padding: 15, borderRadius: 15, width: '31%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionIcon: { fontSize: 24, marginBottom: 5 },
  actionText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  actionSub: { color: '#64748b', fontSize: 10, marginTop: 3 },

  occCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#334155', elevation: 5 },
  occRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  occTitle: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold' },
  occRate: { fontSize: 14, color: '#fbbf24', fontWeight: 'bold', marginTop: 5 },
  occNumber: { fontSize: 45, fontWeight: '900' },
  progressBar: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  occSub: { color: '#64748b', fontSize: 12, textAlign: 'right' },

  bookBtn: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 30, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'flex-end' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginRight: 10 },
  badge: { backgroundColor: '#3b82f6', color: '#fff', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold' },

  bkCard: { backgroundColor: '#1e293b', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  bkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 10 },
  bkSpot: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bkBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bkTime: { color: '#cbd5e1', marginBottom: 8, fontSize: 13, fontWeight: '600' },
  bkPlate: { color: '#64748b', fontSize: 12, marginTop: 5 },
  qrContainer: { backgroundColor: '#fff', padding: 5, borderRadius: 10 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#1e293b', borderRadius: 15, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' }
});
