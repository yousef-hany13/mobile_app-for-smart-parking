import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { booking, parking } from '../services/api';

export default function BookingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [userPlate, setUserPlate] = useState('');
  
  // Custom Selection State
  const [selectedDay, setSelectedDay] = useState(0); // 0: Today, 1: Tomorrow, 2: Day after
  const [selectedHour, setSelectedHour] = useState(2); // Duration in hours
  const [selectedFloor, setSelectedFloor] = useState(0); // 0 = Any floor
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const u = JSON.parse(await AsyncStorage.getItem('user'));
      if (u?.plate) setUserPlate(u.plate);
      try {
        const res = await parking.getFloors();
        setFloors(res.data || []);
      } catch (err) {}
    };
    loadData();
  }, []);

  const handleBookNow = async () => {
    if (!userPlate) return Alert.alert('خطأ', 'لم يتم العثور على رقم اللوحة الخاص بك.');
    
    // Calculate arrive and depart times
    const arriveDate = new Date();
    arriveDate.setDate(arriveDate.getDate() + selectedDay);
    
    const departDate = new Date(arriveDate.getTime() + selectedHour * 60 * 60 * 1000);

    const pad = (n) => n.toString().padStart(2, '0');
    const formatTime = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setLoading(true);
    try {
      await booking.create({
        plate: userPlate,
        arrive: formatTime(arriveDate),
        depart: formatTime(departDate),
        floor_pref: selectedFloor === 0 ? 1 : selectedFloor,
        source: 'Mobile'
      });
      
      Alert.alert('نجاح', 'تم حجز الموقف بنجاح!', [
        { text: 'العودة للرئيسية', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('فشل الحجز', err.response?.data?.error || err.response?.data?.msg || 'حدث خطأ ما تأكد من الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { label: 'اليوم', value: 0 },
    { label: 'غداً', value: 1 },
    { label: 'بعد غد', value: 2 },
  ];

  const hours = [1, 2, 3, 4, 6, 12];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>تفاصيل الحجز 📅</Text>
      
      <View style={styles.plateBox}>
        <Text style={styles.plateLabel}>سيارة رقم:</Text>
        <Text style={styles.plateText}>{userPlate}</Text>
      </View>

      {/* Date Selection */}
      <Text style={styles.sectionTitle}>تاريخ الحجز</Text>
      <View style={styles.row}>
        {days.map(day => (
          <TouchableOpacity 
            key={day.value} 
            style={[styles.pill, selectedDay === day.value && styles.pillActive]}
            onPress={() => setSelectedDay(day.value)}
          >
            <Text style={[styles.pillText, selectedDay === day.value && styles.pillTextActive]}>{day.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration Selection */}
      <Text style={styles.sectionTitle}>مدة التوقف (بالساعات)</Text>
      <View style={styles.grid}>
        {hours.map(hr => (
          <TouchableOpacity 
            key={hr} 
            style={[styles.gridPill, selectedHour === hr && styles.gridPillActive]}
            onPress={() => setSelectedHour(hr)}
          >
            <Text style={[styles.pillText, selectedHour === hr && styles.pillTextActive]}>{hr} ساعة</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floor Selection */}
      <Text style={styles.sectionTitle}>اختيار الطابق</Text>
      <View style={styles.grid}>
        <TouchableOpacity 
          style={[styles.gridPill, selectedFloor === 0 && styles.gridPillActive, { width: '48%' }]}
          onPress={() => setSelectedFloor(0)}
        >
          <Text style={[styles.pillText, selectedFloor === 0 && styles.pillTextActive]}>أي طابق</Text>
        </TouchableOpacity>
        {floors.map(fl => (
          <TouchableOpacity 
            key={fl.floor} 
            style={[styles.gridPill, selectedFloor === fl.floor && styles.gridPillActive, { width: '48%' }]}
            onPress={() => setSelectedFloor(fl.floor)}
          >
            <Text style={[styles.pillText, selectedFloor === fl.floor && styles.pillTextActive]}>طابق {fl.floor}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>الوقت الإجمالي: {selectedHour} ساعة</Text>
        <Text style={styles.summarySub}>سيتم احتساب التكلفة بناءً على أسعار الوقت الفعلي عند خروجك.</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleBookNow} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>تأكيد الحجز الآن</Text>}
      </TouchableOpacity>
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 25, textAlign: 'center' },
  plateBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 30, borderWidth: 1, borderColor: '#334155' },
  plateLabel: { color: '#94a3b8', fontSize: 16, marginRight: 10 },
  plateText: { fontSize: 24, fontWeight: 'bold', color: '#f59e0b', letterSpacing: 2 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  pill: { flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pillActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  gridPill: { width: '30%', backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  gridPillActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  pillText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  pillTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 20, borderRadius: 15, marginBottom: 30, borderColor: '#3b82f6', borderWidth: 1 },
  summaryText: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  summarySub: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  btn: { backgroundColor: '#10b981', padding: 20, borderRadius: 15, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
