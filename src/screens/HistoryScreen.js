import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessions } from '../services/api';

const getIcon = (fee) => {
  if (fee === 0) return '🆓';
  if (fee < 10) return '💚';
  if (fee < 30) return '🔵';
  return '🔴';
};

const formatDuration = (min) => {
  if (!min || min <= 0) return '< 1 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plate, setPlate] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const u = JSON.parse(await AsyncStorage.getItem('user'));
      if (!u?.plate) return;
      setPlate(u.plate);
      const res = await sessions.history(u.plate, 30);
      setHistory(res.data);
    } catch (e) {
      console.log('History load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, []);

  const totalSpent = history.reduce((s, r) => s + (r.fee || 0), 0);
  const totalVisits = history.length;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.leftInfo}>
          <Text style={styles.cardIcon}>{getIcon(item.fee)}</Text>
          <View>
            <Text style={styles.slotText}>طابق {item.floor} — موقف {item.slot}</Text>
            <Text style={styles.dateText}>{item.entry_time?.split(' ')[0]}</Text>
          </View>
        </View>
        <View style={styles.feeBox}>
          <Text style={styles.feeText}>{(item.fee || 0).toFixed(2)}</Text>
          <Text style={styles.feeCurrency}>ج.م</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.metaText}>⬇️ {item.entry_time}</Text>
        <Text style={styles.metaText}>⬆️ {item.exit_time || 'جارٍ التوقف'}</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>⏱ {formatDuration(item.duration_min)}</Text>
        </View>
      </View>
      {item.rating > 0 && (
        <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جارٍ تحميل السجل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerItem}>
          <Text style={styles.bannerValue}>{totalVisits}</Text>
          <Text style={styles.bannerLabel}>إجمالي الزيارات</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bannerItem}>
          <Text style={[styles.bannerValue, { color: '#fbbf24' }]}>
            {totalSpent.toFixed(2)}
          </Text>
          <Text style={styles.bannerLabel}>إجمالي المصروف (ج.م)</Text>
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 50, marginBottom: 15 }}>🏜️</Text>
          <Text style={styles.emptyTitle}>لا يوجد سجل حتى الآن</Text>
          <Text style={styles.emptySub}>زياراتك ستظهر هنا بعد أول توقف</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadHistory(); }}
              tintColor="#fff"
            />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText:  { color: '#94a3b8', marginTop: 12, fontSize: 14 },

  banner: {
    flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 18,
    padding: 20, marginVertical: 16, borderWidth: 1, borderColor: '#334155',
    justifyContent: 'space-around', alignItems: 'center',
  },
  bannerItem:   { alignItems: 'center' },
  bannerValue:  { fontSize: 28, fontWeight: '900', color: '#3b82f6' },
  bannerLabel:  { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  divider:      { width: 1, height: 40, backgroundColor: '#334155' },

  card: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28 },
  slotText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  dateText: { color: '#64748b', fontSize: 12, marginTop: 3 },
  feeBox:   { alignItems: 'flex-end' },
  feeText:  { color: '#10b981', fontSize: 22, fontWeight: '900' },
  feeCurrency: { color: '#64748b', fontSize: 12 },

  cardBottom: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10, gap: 4 },
  metaText:   { color: '#94a3b8', fontSize: 12 },
  durationBadge: {
    marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  durationText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
  rating:       { color: '#fbbf24', marginTop: 8, fontSize: 16 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub:   { color: '#64748b', fontSize: 14, textAlign: 'center' },
});
