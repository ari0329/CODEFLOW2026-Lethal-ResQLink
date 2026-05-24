import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { alertsAPI } from '../services/api';

const TEMPLATES = [
  { label: '🌊 Flood', text: 'Help! Flooding in our area. Water level rising fast. People trapped.' },
  { label: '🔥 Fire',  text: 'Building on fire! People inside unable to evacuate. Need fire brigade urgently.' },
  { label: '🏥 Medical', text: 'Medical emergency. Person unconscious and not breathing. Need ambulance immediately.' },
  { label: '🌍 Earthquake', text: 'Earthquake just occurred. Building collapsed. Multiple people trapped under debris.' },
  { label: '🚗 Accident', text: 'Road accident. Multiple vehicles involved. Injured persons need immediate medical help.' },
];

const SOURCE_OPTIONS = ['mobile', 'form', 'whatsapp', 'twitter', 'telegram'];

export default function SOSSubmitScreen() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('mobile');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const attachGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to attach GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const gpsTag = ` [GPS: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}]`;
      setText((prev) => prev + gpsTag);
    } catch (e) {
      Alert.alert('GPS Error', 'Could not fetch location. Try again.');
    } finally {
      setGpsLoading(false);
    }
  };

  const submit = async () => {
    if (!text.trim()) {
      Alert.alert('Empty message', 'Please describe the emergency before submitting.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await alertsAPI.submit(text.trim(), source);
      setResult({ ok: true, data: res.data });
      setText('');
    } catch (e) {
      setResult({ ok: false, error: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (tmpl) => {
    setText(tmpl.text);
    setResult(null);
  };

  const ResultBanner = () => {
    if (!result) return null;
    if (!result.ok) {
      return (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>❌ {result.error}</Text>
        </View>
      );
    }
    const d = result.data;
    if (d.filtered) return (
      <View style={[styles.banner, styles.bannerWarn]}>
        <Text style={styles.bannerText}>⚠ Filtered — low distress signal. Score: {Math.round((d.score || 0) * 100)}/100</Text>
      </View>
    );
    if (d.duplicate) return (
      <View style={[styles.banner, styles.bannerWarn]}>
        <Text style={styles.bannerText}>🔁 Duplicate alert detected (ID: {d.existingId || 'N/A'})</Text>
      </View>
    );
    if (d.queued) return (
      <View style={[styles.banner, styles.bannerInfo]}>
        <Text style={styles.bannerText}>📡 Queued for processing via Kafka</Text>
      </View>
    );
    return (
      <View style={[styles.banner, styles.bannerOk]}>
        <Text style={styles.bannerText}>
          ✅ Alert submitted — Severity: {d.alert?.severity?.toUpperCase()} · Type: {d.alert?.emergencyType}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

      <Text style={styles.pageTitle}>🆘 Submit Emergency</Text>
      <Text style={styles.pageSub}>Report an active emergency in your area</Text>

      {/* Templates */}
      <Text style={styles.sectionLabel}>QUICK TEMPLATES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRow}>
        {TEMPLATES.map((t) => (
          <TouchableOpacity key={t.label} style={styles.templateBtn} onPress={() => applyTemplate(t)}>
            <Text style={styles.templateText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Text input */}
      <Text style={styles.sectionLabel}>DESCRIBE THE EMERGENCY</Text>
      <TextInput
        style={styles.textArea}
        value={text}
        onChangeText={(v) => { setText(v); setResult(null); }}
        placeholder="Describe what's happening — be specific about location and number of people affected..."
        placeholderTextColor="#4b5563"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={2000}
      />
      <Text style={styles.charCount}>{text.length}/2000</Text>

      {/* GPS Button */}
      <TouchableOpacity
        style={[styles.gpsBtn, gpsLoading && styles.btnDisabled]}
        onPress={attachGPS}
        disabled={gpsLoading}
      >
        {gpsLoading
          ? <ActivityIndicator size="small" color="#00c9a7" />
          : <Text style={styles.gpsBtnText}>📍 Attach GPS Location</Text>
        }
      </TouchableOpacity>

      {/* Source selector */}
      <Text style={styles.sectionLabel}>REPORT SOURCE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow}>
        {SOURCE_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sourceChip, source === s && styles.sourceChipActive]}
            onPress={() => setSource(s)}
          >
            <Text style={[styles.sourceChipText, source === s && styles.sourceChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result banner */}
      <ResultBanner />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (submitting || !text.trim()) && styles.btnDisabled]}
        onPress={submit}
        disabled={submitting || !text.trim()}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>SUBMIT SOS ALERT</Text>
        }
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠ False alerts are a criminal offence and subject to legal action.
          Only submit real emergencies.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#e8edf5', marginBottom: 4 },
  pageSub: { fontSize: 13, color: '#8b9cb5', marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8b9cb5', letterSpacing: 0.8, marginBottom: 10 },
  templateRow: { marginBottom: 20, marginHorizontal: -4 },
  templateBtn: {
    backgroundColor: '#1c2333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3448',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 4,
  },
  templateText: { color: '#e8edf5', fontSize: 13, fontWeight: '500' },
  textArea: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#2a3448',
    borderRadius: 10,
    color: '#e8edf5',
    padding: 14,
    fontSize: 14,
    minHeight: 130,
    lineHeight: 20,
  },
  charCount: { textAlign: 'right', color: '#4b5563', fontSize: 11, marginTop: 4, marginBottom: 12 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,201,167,0.1)',
    borderWidth: 1,
    borderColor: '#00c9a7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  gpsBtnText: { color: '#00c9a7', fontWeight: '600', fontSize: 14 },
  sourceRow: { marginBottom: 20, marginHorizontal: -4 },
  sourceChip: {
    backgroundColor: '#1c2333',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a3448',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginHorizontal: 4,
  },
  sourceChipActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6' },
  sourceChipText: { color: '#8b9cb5', fontSize: 12, textTransform: 'capitalize' },
  sourceChipTextActive: { color: '#3b82f6', fontWeight: '600' },
  banner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  bannerOk:    { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' },
  bannerWarn:  { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b' },
  bannerError: { backgroundColor: 'rgba(232,48,61,0.1)', borderColor: '#e8303d' },
  bannerInfo:  { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' },
  bannerText: { color: '#e8edf5', fontSize: 13, lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#e8303d',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  disclaimer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a3448',
  },
  disclaimerText: { color: '#8b9cb5', fontSize: 11, lineHeight: 16 },
});