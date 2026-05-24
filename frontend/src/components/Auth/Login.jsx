import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.header}>
          <span style={styles.logo}>🆘</span>
          <h1 style={styles.title}>ResQLink</h1>
          <p style={styles.subtitle}>Emergency Response Platform</p>
        </div>

        {/* Form */}
        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="responder@org.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={styles.hint}>
          No account? Ask your admin to register you at <code>/api/auth/register</code>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '48px',
  },
  title: {
    margin: '8px 0 4px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#e6edf3',
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#8b949e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#8b949e',
  },
  input: {
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#e6edf3',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: '#2d1515',
    border: '1px solid #f85149',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#f85149',
  },
  button: {
    background: '#238636',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s',
  },
  hint: {
    marginTop: '24px',
    fontSize: '11px',
    color: '#484f58',
    textAlign: 'center',
  },
};