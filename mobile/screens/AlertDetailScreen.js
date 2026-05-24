import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { alertsAPI } from '../services/api';
import SeverityIndicator from '../components/SeverityIndicator';
import { formatDistanceToNow } from '../utils/timeUtils';

const TYPE_EMOJI = {
  flood: '🌊', fire: '🔥', accident: '🚗', medical: '🏥',
  violence: '⚠️', earthquake: '🌍', collapse: '🏗️', unknown: '🆘',
};

const STATUS_COLOR = {
  new:         '#3b82f6',
  assigned:    '#8b5cf6',
  in_progress: '#f59e0b',
  resolved:    '#10b981',
  dismissed:   '#6b7280',
};

function InfoRow({ label, value, mono, accent }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[
        styles.infoValue,
        mono && styles.mono,
        accent && { color: accent },
      ]}>
        {String(value)}
      </Text>
    </View>
  );
}

export default function AlertDetailScreen({ route }) {
  const { alert: passedAlert, alertId } = route.params || {};
  const [alert, setAlert] = useState(passedAlert || null);
  const [loading, setLoading] = useState(!passedAlert && !!alertId);

  useEffect(() => {
    if (!passedAlert && alertId) {
      alertsAPI.getById(alertId)
        .then((res) => setAlert(res.data))
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [alertId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e8303d" />
      </View>
    );
  }

  if (!alert) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Alert not found</Text>
      </View>
    );
  }

  const emoji = TYPE_EMOJI[alert.emergencyType] || '🆘';
  const score = Math.round((alert.distressScore || 0) * 100);
  const hasCoords = alert.coordinates?.coordinates?.length === 2;
  const [lng, lat] = hasCoords ? alert.coordinates.coordinates : [null, null];
  const statusColor = STATUS_COLOR[alert.status] || '#8b9cb5';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>

      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{emoji}</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.heroType}>
            {(alert.emergencyType || 'unknown').toUpperCase()}
          </Text>
          <SeverityIndicator severity={alert.severity} variant="badge" />
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {(alert.status || 'new').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Distress score bar */}
      <View style={styles.scoreBlock}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>Distress Score</Text>
          <Text style={[styles.scoreNum, score >= 85 && { color: '#e8303d' }]}>
            {score}/100
          </Text>
        </View>
        <View style={styles.scoreTrack}>
          <View
            style={[
              styles.scoreFill,
              {
                width: `${score}%`,
                backgroundColor: score >= 85 ? '#e8303d' : score >= 65 ? '#f97316' : score >= 40 ? '#f59e0b' : '#10b981',
              },
            ]}
          />
        </View>
      </View>

      {/* Raw message */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Original Message</Text>
        <Text style={styles.rawText}>{alert.rawText}</Text>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Location</Text>
        <InfoRow label="Description" value={alert.locationText} />
        <InfoRow label="Address"     value={alert.addressText} />
        <InfoRow label="Landmark"    value={alert.landmark} />
        {hasCoords && (
          <InfoRow
            label="Coordinates"
            value={`${lat?.toFixed(5)}, ${lng?.toFixed(5)}`}
            mono
            accent="#00c9a7"
          />
        )}
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ Details</Text>
        <InfoRow label="Language"     value={alert.language !== 'en' ? alert.language?.toUpperCase() : null} />
        <InfoRow label="Victims"      value={alert.victimCount} accent="#f97316" />
        <InfoRow label="Source"       value={alert.source} />
        <InfoRow label="Source ID"    value={alert.sourceId} mono />
        <InfoRow label="Fake Score"   value={alert.fakeScore != null ? `${Math.round((alert.fakeScore || 0) * 100)}%` : null} />
        <InfoRow label="Is Duplicate" value={alert.isDuplicate ? 'Yes' : null} accent="#f59e0b" />
        <InfoRow label="Assigned To"  value={alert.assignedTo?.name} />
        <InfoRow label="Resolved At"  value={alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : null} />
        <InfoRow label="Detected"     value={formatDistanceToNow(alert.detectedAt || alert.createdAt)} />
      </View>

      {/* Notes */}
      {alert.notes?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗒 Notes</Text>
          {alert.notes.map((note, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={styles.noteText}>{note.text}</Text>
              <Text style={styles.noteMeta}>{formatDistanceToNow(note.at)}</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  scroll: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#8b9cb5', fontSize: 15 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3448',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  heroEmoji: { fontSize: 32 },
  heroInfo: { flex: 1, gap: 6 },
  heroType: { fontSize: 14, fontWeight: '700', color: '#e8edf5' },
  statusPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  scoreBlock: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a3448',
    padding: 14,
    marginBottom: 12,
  },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  scoreLabel: { fontSize: 12, color: '#8b9cb5' },
  scoreNum: { fontSize: 16, fontWeight: '700', color: '#3b82f6' },
  scoreTrack: { height: 6, backgroundColor: '#1c2333', borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 3 },

  card: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a3448',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#8b9cb5', marginBottom: 12, letterSpacing: 0.5 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2333',
  },
  infoLabel: { fontSize: 12, color: '#8b9cb5', flex: 1 },
  infoValue: { fontSize: 13, color: '#e8edf5', flex: 2, textAlign: 'right' },
  mono: { fontFamily: Platform?.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 11 },

  rawText: { fontSize: 14, color: '#e8edf5', lineHeight: 21 },

  noteRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2333',
  },
  noteText: { fontSize: 13, color: '#e8edf5', marginBottom: 4 },
  noteMeta: { fontSize: 11, color: '#8b9cb5' },
});