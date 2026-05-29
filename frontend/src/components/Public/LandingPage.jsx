import { useNavigate } from "react-router-dom";
import SOSForm from "./SOSForm";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          🚨 <span style={styles.brandText}>ResQLink</span>
        </div>
        <div style={styles.navButtons}>
          <button
            style={styles.signInBtn}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
          <button
            style={styles.signUpBtn}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>
          Emergency Response,{" "}
          <span style={styles.heroHighlight}>Instantly Connected</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Send an SOS alert instantly — no account needed.
          Our AI-powered system dispatches help to your location in seconds.
        </p>

        <div style={styles.heroBadges}>
          <span style={styles.badge}>🤖 AI-Powered</span>
          <span style={styles.badge}>📍 GPS Location</span>
          <span style={styles.badge}>⚡ Real-time Alerts</span>
          <span style={styles.badge}>🔒 Secure</span>
        </div>
      </div>

      {/* ── SOS Form ── */}
      <div style={styles.formSection}>
        <SOSForm />
      </div>

      {/* ── Responder CTA ── */}
      <div style={styles.responderCta}>
        <p style={styles.ctaText}>
          Are you a first responder or administrator?
        </p>
        <button
          style={styles.ctaBtn}
          onClick={() => navigate("/login")}
        >
          🔐 Access Responder Dashboard
        </button>
      </div>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p>© 2026 ResQLink — Emergency Response Platform</p>
      </footer>

    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  // Navbar
  nav: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 40px",
    backgroundColor: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#dc2626",
  },
  brandText: {
    color: "#1f2937",
  },
  navButtons: {
    display: "flex",
    gap: "12px",
  },
  signInBtn: {
    padding: "8px 20px",
    backgroundColor: "transparent",
    border: "2px solid #1d4ed8",
    color: "#1d4ed8",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  signUpBtn: {
    padding: "8px 20px",
    backgroundColor: "#1d4ed8",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // Hero
  hero: {
    textAlign: "center",
    padding: "60px 20px 30px",
    maxWidth: "700px",
  },
  heroTitle: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#1f2937",
    lineHeight: 1.2,
    marginBottom: "16px",
  },
  heroHighlight: {
    color: "#dc2626",
  },
  heroSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  heroBadges: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  badge: {
    padding: "6px 14px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
  },

  // SOS Form section
  formSection: {
    width: "100%",
    maxWidth: "520px",
    padding: "0 20px",
  },

  // Responder CTA
  responderCta: {
    marginTop: "40px",
    padding: "30px",
    backgroundColor: "#1f2937",
    borderRadius: "12px",
    textAlign: "center",
    maxWidth: "500px",
    width: "90%",
  },
  ctaText: {
    color: "#d1d5db",
    marginBottom: "14px",
    fontSize: "15px",
  },
  ctaBtn: {
    padding: "12px 28px",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  // Footer
  footer: {
    marginTop: "60px",
    padding: "20px",
    color: "#9ca3af",
    fontSize: "13px",
    textAlign: "center",
  },
};

export default LandingPage;