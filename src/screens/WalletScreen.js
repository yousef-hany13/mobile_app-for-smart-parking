import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, RefreshControl, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wallet as walletAPI } from '../services/api';

const TOP_UP_AMOUNTS = [50, 100, 200, 500];

export default function WalletScreen() {
  const [balance, setBalance]   = useState(0);
  const [txns, setTxns]         = useState([]);
  const [plate, setPlate]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount]     = useState('');
  const [topping, setTopping]               = useState(false);

  const load = useCallback(async () => {
    try {
      const u = JSON.parse(await AsyncStorage.getItem('user'));
      if (!u?.plate) return;
      setPlate(u.plate);
      const res = await walletAPI.balance(u.plate);
      setBalance(res.data.balance);
      setTxns(res.data.transactions || []);
    } catch (e) {
      console.log('Wallet load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleTopUp = async () => {
    const amount = parseFloat(customAmount) || selectedAmount;
    if (!amount || amount < 10) {
      Alert.alert('خطأ', 'الحد الأدنى للشحن هو 10 ج.م');
      return;
    }
    setTopping(true);
    try {
      const res = await walletAPI.topup(plate, amount, 'card');
      setBalance(res.data.new_balance);
      setShowModal(false);
      setCustomAmount('');
      Alert.alert('✅ تم الشحن', `تم إضافة ${amount} ج.م للمحفظة\nالرصيد الجديد: ${res.data.new_balance} ج.م`);
      load();
    } catch (e) {
      Alert.alert('خطأ', e.response?.data?.msg || 'فشل الشحن');
    } finally {
      setTopping(false);
    }
  };

  const txnIcon = (type) => {
    if (type === 'topup')   return { icon: '⬆️', color: '#10b981' };
    if (type === 'payment') return { icon: '⬇️', color: '#ef4444' };
    if (type === 'refund')  return { icon: '🔄', color: '#f59e0b' };
    return { icon: '💳', color: '#94a3b8' };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>رصيد المحفظة</Text>
        <Text style={styles.balanceAmount}>{balance.toFixed(2)}</Text>
        <Text style={styles.balanceCurrency}>جنيه مصري</Text>
        <Text style={styles.balancePlate}>{plate}</Text>
      </View>

      {/* Top-up Button */}
      <TouchableOpacity style={styles.topupBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.topupBtnText}>⚡ شحن المحفظة</Text>
      </TouchableOpacity>

      {/* Info Note */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 يمكنك استخدام رصيد المحفظة لسداد رسوم الوقوف تلقائياً عند الخروج بدلاً من الدفع نقداً.
        </Text>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>العمليات الأخيرة</Text>

      {txns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>💳</Text>
          <Text style={styles.emptyText}>لا توجد عمليات سابقة</Text>
        </View>
      ) : (
        txns.map((t) => {
          const { icon, color } = txnIcon(t.type);
          return (
            <View key={t.id} style={styles.txnRow}>
              <View style={[styles.txnIcon, { backgroundColor: `${color}20` }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnNote}>{t.note || t.type}</Text>
                <Text style={styles.txnDate}>{t.created_at}</Text>
              </View>
              <Text style={[styles.txnAmount, { color }]}>
                {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)} ج.م
              </Text>
            </View>
          );
        })
      )}

      <View style={{ height: 50 }} />

      {/* Top-up Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>💳 شحن المحفظة</Text>

            <Text style={styles.modalLabel}>اختر المبلغ</Text>
            <View style={styles.amountGrid}>
              {TOP_UP_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amountBtn, selectedAmount === amt && !customAmount && styles.amountBtnActive]}
                  onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                >
                  <Text style={[styles.amountBtnText, selectedAmount === amt && !customAmount && { color: '#fff' }]}>
                    {amt} ج.م
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>أو أدخل مبلغاً مخصصاً</Text>
            <TextInput
              style={styles.modalInput} value={customAmount} onChangeText={setCustomAmount}
              placeholder="0.00" placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleTopUp} disabled={topping}>
                {topping
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmBtnText}>شحن الآن</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16 },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },

  balanceCard: {
    backgroundColor: '#1e40af', borderRadius: 24, padding: 30, alignItems: 'center',
    marginVertical: 20, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  balanceLabel:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },
  balanceAmount:   { color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: 2 },
  balanceCurrency: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 4 },
  balancePlate:    { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 },

  topupBtn: {
    backgroundColor: '#10b981', borderRadius: 16, padding: 18, alignItems: 'center',
    marginBottom: 16, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  topupBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  infoBox: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 14,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
  infoText: { color: '#93c5fd', fontSize: 13, lineHeight: 20, textAlign: 'right' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 },

  txnRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  txnIcon:   { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txnInfo:   { flex: 1 },
  txnNote:   { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'right' },
  txnDate:   { color: '#64748b', fontSize: 11, marginTop: 3, textAlign: 'right' },
  txnAmount: { fontSize: 16, fontWeight: '900' },

  emptyState: { paddingVertical: 40, alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  emptyText:  { color: '#64748b', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 30, paddingBottom: 50,
  },
  modalTitle:  { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  modalLabel:  { color: '#94a3b8', fontSize: 13, marginBottom: 12, textAlign: 'right' },
  amountGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  amountBtn: {
    width: '47%', backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  amountBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  amountBtnText:   { color: '#94a3b8', fontSize: 16, fontWeight: '800' },
  modalInput: {
    backgroundColor: '#0f172a', color: '#fff', borderRadius: 12, padding: 14,
    fontSize: 18, borderWidth: 1, borderColor: '#334155', textAlign: 'center', marginBottom: 24,
  },
  modalActions:  { flexDirection: 'row', gap: 12 },
  cancelBtn:     { flex: 1, backgroundColor: '#334155', borderRadius: 14, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 15 },
  confirmBtn:    { flex: 1, backgroundColor: '#10b981', borderRadius: 14, padding: 16, alignItems: 'center' },
  confirmBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },
});
