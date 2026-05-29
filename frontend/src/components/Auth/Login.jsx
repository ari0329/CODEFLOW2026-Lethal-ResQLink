import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../../store/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      // Save to Redux store
      dispatch(loginSuccess({ user: data.user, token: data.token }));

      // Redirect based on role
      if (data.user.role === "admin" || data.user.role === "responder") {
        navigate("/dashboard");
      } else if (data.user.role === "analyst") {
        navigate("/analytics");
      } else {
        navigate("/");
      }

    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔐 ResQLink Login</h2>
      <p style={styles.subtitle}>For responders and administrators only</p>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <p style={styles.footer}>
        Public emergency?{" "}
        <Link to="/sos" style={{ color: "#dc2626" }}>
          Send SOS instead →
        </Link>
      </p>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "420px",
    margin: "60px auto",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
  },
  title: { color: "#1f2937", marginBottom: "4px" },
  subtitle: { color: "#6b7280", fontSize: "14px", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontWeight: "600", fontSize: "14px", color: "#374151" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  footer: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#6b7280",
  },
};

export default Login;