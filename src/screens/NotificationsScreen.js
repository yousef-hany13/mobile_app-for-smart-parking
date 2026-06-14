import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifications as notifAPI } from '../services/api';

const TYPE_CONFIG = {
  success: { color: '#10b981', bg: '#10b98115', icon: '✅' },
  warning: { color: '#f59e0b', bg: '#f59e0b15', icon: '⚠️' },
  booking: { color: '#3b82f6', bg: '#3b82f615', icon: '📅' },
  info:    { color: '#94a3b8', bg: '#94a3b815', icon: 'ℹ️' },
};

export default function NotificationsScreen() {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread]     = useState(0);
  const [plate, setPlate]       = useState('');

  const load = useCallback(async () => {
    try {
      const u = JSON.parse(await AsyncStorage.getItem('user'));
      if (!u?.plate) return;
      setPlate(u.plate);
      const res = await notifAPI.list(u.plate);
      setNotifs(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch (e) {
      console.log('Notif load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      await notifAPI.markAllRead(plate);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch (e) {
      console.log('Mark read error', e);
    }
  };

  const markOne = async (id) => {
    try {
      await notifAPI.markRead(plate, id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const renderItem = ({ item }) => {
    const c = cfg(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: item.is_read ? '#1e293b' : c.bg, borderColor: item.is_read ? '#334155' : c.color }]}
        onPress={() => !item.is_read && markOne(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{c.icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: item.is_read ? '#94a3b8' : '#fff' }]}>{item.title}</Text>
          <Text style={styles.cardBody_}>{item.body}</Text>
          <Text style={styles.cardTime}>{item.created_at}</Text>
        </View>
        {!item.is_read && <View style={[styles.dot, { backgroundColor: c.color }]} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>التنبيهات</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>تحديد الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 50, marginBottom: 15 }}>🔔</Text>
          <Text style={styles.emptyTitle}>لا توجد تنبيهات</Text>
          <Text style={styles.emptySub}>ستصلك التنبيهات هنا فور حدوث أي تحديث</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle:  { color: '#fff', fontSize: 24, fontWeight: '900' },
  badge: {
    backgroundColor: '#ef4444', borderRadius: 12, minWidth: 22,
    paddingHorizontal: 6, paddingVertical: 2, justifyContent: 'center', alignItems: 'center',
  },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllBtn:   { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  markAllText:  { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

  card: {
    flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, alignItems: 'flex-start',
  },
  cardLeft: { marginRight: 12, paddingTop: 2 },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  cardBody_: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  cardTime:  { color: '#475569', fontSize: 11, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginLeft: 8 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub:   { color: '#64748b', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});
