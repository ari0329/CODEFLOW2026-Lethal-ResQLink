import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { alertsAPI } from '../services/api';
import AlertCard from '../components/AlertCard';
import { useSocket } from '../hooks/useSocket';

const FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

const PILL_ACTIVE_STYLES = {
  all:      { backgroundColor: 'rgba(59,130,246,0.15)',  borderColor: '#3b82f6' },
  critical: { backgroundColor: 'rgba(232,48,61,0.15)',   borderColor: '#e8303d' },
  high:     { backgroundColor: 'rgba(249,115,22,0.15)',  borderColor: '#f97316' },
  medium:   { backgroundColor: 'rgba(245,158,11,0.15)',  borderColor: '#f59e0b' },
  low:      { backgroundColor: 'rgba(16,185,129,0.15)',  borderColor: '#10b981' },
};

const PILL_ACTIVE_TEXT = {
  all: '#3b82f6', critical: '#e8303d', high: '#f97316', medium: '#f59e0b', low: '#10b981',
};

export default function AlertListScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAlerts = useCallback(async (sev, pg) => {
    try {
      const params = { page: pg, limit: 20 };
      if (sev !== 'all') params.severity = sev;
      const res = await alertsAPI.getAll(params);
      const incoming = res.data.alerts || res.data || [];
      if (pg === 1) { setAlerts(incoming); } else { setAlerts((prev) => [...prev, ...incoming]); }
      setTotal(res.data.total || incoming.length);
      setPage(pg);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { setLoading(true); fetchAlerts(severity, 1); }, [severity]);
  const onRefresh = () => { setRefreshing(true); fetchAlerts(severity, 1); };

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'NEW_ALERT' || msg.type === 'URGENT_ALERT') {
      setAlerts((prev) => {
        if (prev.find((a) => a._id === msg.alert._id)) return prev;
        return [msg.alert, ...prev];
      });
    }
  }, []);

  useSocket(handleWsMessage, true);
  const loadMore = () => { if (alerts.length < total) fetchAlerts(severity, page + 1); };

  return (
    <View style={styles.root}>
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const isActive = severity === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.pill, isActive && PILL_ACTIVE_STYLES[f]]}
              onPress={() => setSeverity(f)}
            >
              <Text style={[styles.pillText, isActive && { color: PILL_ACTIVE_TEXT[f] }]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loaderBox}><ActivityIndicator size="large" color="#e8303d" /></View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AlertCard alert={item} onPress={() => navigation.navigate('AlertDetail', { alert: item })} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e8303d" colors={['#e8303d']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>No alerts found</Text>
              <Text style={styles.emptySubtext}>Pull to refresh</Text>
            </View>
          }
          ListFooterComponent={alerts.length < total ? <ActivityIndicator color="#8b9cb5" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#2a3448', backgroundColor: '#111827' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#1c2333', borderWidth: 1, borderColor: '#2a3448' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#8b9cb5' },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 14, paddingBottom: 30 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 16, color: '#e8edf5', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#8b9cb5' },
});