import { useState } from "react";

const SOSForm = () => {
  const [form, setForm] = useState({
    message: "",
    location: "",
    contactNumber: "",
    emergencyType: "unknown",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `${pos.coords.latitude}, ${pos.coords.longitude}`,
        }));
      },
      () => setError("Could not detect location. Please type it manually.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/alerts/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("Failed to send SOS. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div style={styles.successBox}>
        <h2>🆘 SOS Sent Successfully</h2>
        <p>Help is on the way. Stay calm and stay safe.</p>
        <button
          style={styles.button}
          onClick={() => setSubmitted(false)}
        >
          Send Another Alert
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🆘 Send Emergency Alert</h2>
      <p style={styles.subtitle}>
        No account needed. Fill the form and help will be dispatched.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Emergency Type */}
        <label style={styles.label}>Emergency Type</label>
        <select
          style={styles.input}
          value={form.emergencyType}
          onChange={(e) =>
            setForm({ ...form, emergencyType: e.target.value })
          }
        >
          <option value="unknown">Select type...</option>
          <option value="fire">🔥 Fire</option>
          <option value="flood">🌊 Flood</option>
          <option value="medical">🏥 Medical</option>
          <option value="accident">🚗 Accident</option>
          <option value="violence">⚠️ Violence</option>
          <option value="earthquake">🌍 Earthquake</option>
        </select>

        {/* Message */}
        <label style={styles.label}>Describe the Emergency *</label>
        <textarea
          style={{ ...styles.input, height: "100px" }}
          placeholder="What is happening? Be as specific as possible..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />

        {/* Location */}
        <label style={styles.label}>Location *</label>
        <input
          style={styles.input}
          placeholder="Street, area, city..."
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />
        <button
          type="button"
          style={styles.detectBtn}
          onClick={detectLocation}
        >
          📍 Auto-detect My Location
        </button>

        {/* Contact */}
        <label style={styles.label}>Contact Number (optional)</label>
        <input
          style={styles.input}
          placeholder="Your phone number..."
          value={form.contactNumber}
          onChange={(e) =>
            setForm({ ...form, contactNumber: e.target.value })
          }
        />

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Sending..." : "🆘 SEND SOS"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
  },
  title: {
    color: "#dc2626",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "20px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#374151",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "14px",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  detectBtn: {
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  successBox: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    backgroundColor: "#dcfce7",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
};

export default SOSForm;