import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Circle, Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { alertsAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const KOLKATA = { latitude: 22.5726, longitude: 88.3639, latitudeDelta: 0.35, longitudeDelta: 0.35 };

const SEVERITY_COLOR = {
  critical: '#e8303d',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#10b981',
};

const CIRCLE_RADIUS = { critical: 600, high: 450, medium: 300, low: 200 };

const TYPE_EMOJI = {
  flood: '🌊', fire: '🔥', accident: '🚗', medical: '🏥',
  violence: '⚠️', earthquake: '🌍', collapse: '🏗️', unknown: '🆘',
};

// Dark map style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b9cb5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c2333' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2a3448' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function HomeScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await alertsAPI.getAll({ limit: 200, status: 'new' });
      setAlerts(res.data.alerts || res.data || []);
    } catch (e) {
      console.warn('Fetch alerts error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAlerts]);

  // Live WS updates
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'NEW_ALERT' || msg.type === 'URGENT_ALERT') {
      setAlerts((prev) => {
        const exists = prev.find((a) => a._id === msg.alert._id);
        if (exists) return prev;
        setNewCount((n) => n + 1);
        return [msg.alert, ...prev];
      });
    }
    if (msg.type === 'connected') setWsConnected(true);
  }, []);

  const { connected } = useSocket(handleWsMessage, true);

  useEffect(() => { setWsConnected(connected); }, [connected]);

  const validAlerts = alerts.filter(
    (a) => a.coordinates?.coordinates?.length === 2
  );

  const flyTo = (alert) => {
    const [lng, lat] = alert.coordinates.coordinates; // GeoJSON: [lng, lat]
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      800
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🆘 ResQLink</Text>
          <Text style={styles.headerSub}>Live Emergency Map</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.wsDot, wsConnected ? styles.wsOn : styles.wsOff]} />
          <Text style={styles.wsLabel}>{wsConnected ? 'LIVE' : 'CONN...'}</Text>
          {newCount > 0 && (
            <TouchableOpacity onPress={() => setNewCount(0)} style={styles.newBadge}>
              <Text style={styles.newBadgeText}>+{newCount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#e8303d" />
          <Text style={styles.loaderText}>Loading alerts...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={KOLKATA}
          customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
          userInterfaceStyle="dark"
          showsUserLocation
          showsCompass={false}
        >
          {validAlerts.map((alert) => {
            const [lng, lat] = alert.coordinates.coordinates;
            const color = SEVERITY_COLOR[alert.severity] || '#8b9cb5';
            const radius = CIRCLE_RADIUS[alert.severity] || 200;
            const emoji = TYPE_EMOJI[alert.emergencyType] || '🆘';

            return (
              <React.Fragment key={alert._id}>
                <Circle
                  center={{ latitude: lat, longitude: lng }}
                  radius={radius}
                  fillColor={color + '28'}
                  strokeColor={color}
                  strokeWidth={1.5}
                />
                <Marker
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => flyTo(alert)}
                >
                  <View style={[styles.markerPin, { borderColor: color }]}>
                    <Text style={styles.markerEmoji}>{emoji}</Text>
                  </View>
                  <Callout onPress={() => navigation.navigate('AlertDetail', { alert })}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutType}>{emoji} {alert.emergencyType?.toUpperCase()}</Text>
                      <Text style={[styles.calloutSev, { color }]}>{alert.severity?.toUpperCase()}</Text>
                      {alert.locationText ? (
                        <Text style={styles.calloutLoc} numberOfLines={1}>📍 {alert.locationText}</Text>
                      ) : null}
                      <Text style={styles.calloutTap}>Tap for details →</Text>
                    </View>
                  </Callout>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapView>
      )}

      {/* Summary strip */}
      <View style={styles.strip}>
        {['critical', 'high', 'medium', 'low'].map((sev) => {
          const count = validAlerts.filter((a) => a.severity === sev).length;
          return (
            <View key={sev} style={styles.stripItem}>
              <Text style={[styles.stripCount, { color: SEVERITY_COLOR[sev] }]}>{count}</Text>
              <Text style={styles.stripLabel}>{sev.toUpperCase()}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#2a3448',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#e8edf5' },
  headerSub: { fontSize: 11, color: '#8b9cb5', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wsDot: { width: 8, height: 8, borderRadius: 4 },
  wsOn: { backgroundColor: '#10b981' },
  wsOff: { backgroundColor: '#e8303d' },
  wsLabel: { fontSize: 10, color: '#8b9cb5', fontWeight: '700' },
  newBadge: {
    backgroundColor: '#e8303d',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  map: { flex: 1 },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: '#8b9cb5', fontSize: 14 },
  markerPin: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
  },
  markerEmoji: { fontSize: 16 },
  callout: { width: 180, padding: 8 },
  calloutType: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  calloutSev: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  calloutLoc: { fontSize: 11, color: '#666', marginBottom: 4 },
  calloutTap: { fontSize: 10, color: '#3b82f6' },
  strip: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#2a3448',
    paddingVertical: 10,
  },
  stripItem: { flex: 1, alignItems: 'center' },
  stripCount: { fontSize: 20, fontWeight: '700' },
  stripLabel: { fontSize: 9, color: '#8b9cb5', marginTop: 2, fontWeight: '600' },
});