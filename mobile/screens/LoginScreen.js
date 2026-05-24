import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation, standalone }) {
  const { login, loading, error, token, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token && navigation) navigation.replace('MainTabs');
  }, [token]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    clearError?.();
    const ok = await login(email.trim().toLowerCase(), password);
    if (ok && navigation) navigation.replace('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBlock}>
          <Text style={styles.logoIcon}>🆘</Text>
          <Text style={styles.logoText}>ResQLink</Text>
          <Text style={styles.tagline}>Emergency SOS Intelligence Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@resqlink.dev"
            placeholderTextColor="#4b5563"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#4b5563"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Dev credentials hint */}
        <View style={styles.devHint}>
          <Text style={styles.devTitle}>Dev Credentials</Text>
          {[
            ['admin@resqlink.dev', 'Admin@1234', 'admin'],
            ['responder@resqlink.dev', 'Resp@1234', 'responder'],
            ['analyst@resqlink.dev', 'Analyst@1234', 'analyst'],
          ].map(([em, pw, role]) => (
            <TouchableOpacity
              key={role}
              onPress={() => { setEmail(em); setPassword(pw); }}
              style={styles.credRow}
            >
              <Text style={styles.credRole}>{role}</Text>
              <Text style={styles.credEmail}>{em}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBlock: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: '700', color: '#e8edf5', letterSpacing: 1 },
  tagline: { fontSize: 12, color: '#8b9cb5', marginTop: 4 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3448',
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#e8edf5', marginBottom: 20 },
  errorBox: {
    backgroundColor: 'rgba(232,48,61,0.12)',
    borderWidth: 1,
    borderColor: '#e8303d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: '#e8303d', fontSize: 13 },
  label: { fontSize: 12, color: '#8b9cb5', fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1c2333',
    borderWidth: 1,
    borderColor: '#2a3448',
    borderRadius: 8,
    color: '#e8edf5',
    padding: 12,
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#e8303d',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  devHint: {
    marginTop: 28,
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a3448',
    padding: 16,
  },
  devTitle: { fontSize: 11, color: '#8b9cb5', fontWeight: '700', marginBottom: 10, letterSpacing: 0.8 },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2333',
  },
  credRole: { fontSize: 12, color: '#00c9a7', fontWeight: '600', width: 80 },
  credEmail: { fontSize: 12, color: '#8b9cb5' },
});