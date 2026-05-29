import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

import cfg from "../../config";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "public",    label: "Public / Citizen",    icon: "👤", desc: "Report emergencies, view alerts" },
  { value: "responder", label: "First Responder",      icon: "🧑‍🚒", desc: "NDRF, Police, Fire Brigade" },
  { value: "ngo",       label: "NGO / Relief Agency",  icon: "🤝", desc: "Volunteer & aid organizations" },
  { value: "analyst",   label: "Analyst / Researcher", icon: "📊", desc: "Data analysis & reporting" },
];

const INITIAL_FORM = {
  name:            "",
  email:           "",
  password:        "",
  confirmPassword: "",
  role:            "public",
  organization:    "",
  badgeId:         "",
  phone:           "",
};

// ── Password strength calculator ──────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)              score++;
  if (pw.length >= 12)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[a-z]/.test(pw))           score++;
  if (/\d/.test(pw))              score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;

  if (score <= 2) return { score, label: "Weak",   color: "var(--red)",    width: "25%"  };
  if (score <= 3) return { score, label: "Fair",   color: "var(--orange)", width: "50%"  };
  if (score <= 4) return { score, label: "Good",   color: "var(--yellow)", width: "75%"  };
  return           { score, label: "Strong", color: "var(--green)",  width: "100%" };
};

// ── Field-level validation ────────────────────────────────────────────────────
const validate = (form) => {
  const errs = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.name = "Name must be at least 2 characters.";
  if (!/^\S+@\S+\.\S+$/.test(form.email))
    errs.email = "Enter a valid email address.";
  if (form.password.length < 8)
    errs.password = "Password must be at least 8 characters.";
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
    errs.password = "Must include uppercase, lowercase, and a number.";
  if (form.password !== form.confirmPassword)
    errs.confirmPassword = "Passwords do not match.";
  if (form.phone && !/^[+\d\s\-]{7,15}$/.test(form.phone))
    errs.phone = "Enter a valid phone number.";
  if (["responder", "ngo"].includes(form.role) && !form.organization.trim())
    errs.organization = "Organization is required for this role.";
  return errs;
};

// ── Reusable Field wrapper ────────────────────────────────────────────────────
const Field = ({ label, error, required, children, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{
      fontSize: "0.78rem", fontWeight: 500,
      color: "var(--text-300)", display: "flex", gap: 4,
    }}>
      {label}
      {required && <span style={{ color: "var(--red)" }}>*</span>}
    </label>
    {children}
    {hint && !error && (
      <span style={{ fontSize: "0.7rem", color: "var(--text-500)" }}>{hint}</span>
    )}
    {error && (
      <span style={{ fontSize: "0.72rem", color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
        ⚠ {error}
      </span>
    )}
  </div>
);

// ── Page wrapper ──────────────────────────────────────────────────────────────
function PageWrapper({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh",
      background: "var(--bg-900)",
      padding: 16,
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.05) 0%, transparent 50%)
      `,
    }}>
      <div className="card" style={{
        width: "100%", maxWidth: 440,
        padding: "32px 28px",
        boxShadow: "var(--shadow-lg)",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Signup Component ─────────────────────────────────────────────────────
export default function Signup() {
 
  const navigate   = useNavigate();

  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState("");
  const [busy,    setBusy]    = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [touched, setTouched] = useState({});
  const [step,    setStep]    = useState(1); // 1 = Account, 2 = Profile

  const pwStrength = getPasswordStrength(form.password);

  // ── Field updater ─────────────────────────────────────────────────────────
  const set = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = "Must include uppercase, lowercase, and a number.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleNextStep = () => {
    const e = validateStep1();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      setTouched({ name:true, email:true, password:true, confirmPassword:true });
      return;
    }
    setErrors({});
    setStep(2);
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allErrors = validate(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    setBusy(true);
    setApiErr("");
    try {
      const payload = {
        name:         form.name.trim(),
        email:        form.email.trim().toLowerCase(),
        password:     form.password,
        role:         form.role,
        organization: form.organization.trim(),
        badgeId:      form.badgeId.trim(),
        phone:        form.phone.trim(),
      };
      const { data } = await axios.post(`${cfg.API_URL}/api/auth/register`, payload);
      setSuccess(true);
      setTimeout(() => {
        login(data.token, data.user);
        navigate("/");
      }, 1500);
    } catch (ex) {
      const msg =
        ex.response?.data?.error ||
        ex.response?.data?.errors?.[0]?.msg ||
        "Registration failed. Please try again.";
      setApiErr(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>
            Account Created!
          </h2>
          <p style={{ color: "var(--text-300)", fontSize: "0.9rem", marginBottom: 20 }}>
            Welcome to ResQLink. Redirecting to dashboard…
          </p>
          <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto" }} />
        </div>
      </PageWrapper>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <PageWrapper>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🚨</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
          Join ResQLink
        </h1>
        <p style={{ color: "var(--text-300)", fontSize: "0.82rem", marginTop: 4 }}>
          Emergency Response Platform
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        {[1, 2].map((s, i) => (
          <React.Fragment key={s}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 6, flex: 1,
                       cursor: s < step ? "pointer" : "default" }}
              onClick={() => s < step && setStep(s)}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                background: step >= s ? "var(--blue)" : "var(--bg-600)",
                color:      step >= s ? "#fff"        : "var(--text-500)",
                transition: "all 0.2s",
              }}>
                {step > s ? "✓" : s}
              </div>
              <span style={{
                fontSize: "0.72rem", fontWeight: 500,
                color: step >= s ? "var(--text-100)" : "var(--text-500)",
              }}>
                {s === 1 ? "Account" : "Profile"}
              </span>
            </div>
            {i < 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px",
                background:  step > 1 ? "var(--blue)" : "var(--bg-600)",
                transition:  "background 0.3s",
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ────────────────── STEP 1: Account ────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Full Name */}
            <Field label="Full Name" required error={touched.name && errors.name}>
              <input
                className={`input ${touched.name && errors.name ? "input-error" : ""}`}
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                maxLength={100}
                autoComplete="name"
                onChange={e => set("name", e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, name: true }))}
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" required error={touched.email && errors.email}>
              <input
                className={`input ${touched.email && errors.email ? "input-error" : ""}`}
                type="email"
                placeholder="you@agency.org"
                value={form.email}
                autoComplete="email"
                onChange={e => set("email", e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              required
              error={touched.password && errors.password}
              hint="Min 8 chars · uppercase · lowercase · number"
            >
              <div style={{ position: "relative" }}>
                <input
                  className={`input ${touched.password && errors.password ? "input-error" : ""}`}
                  type={showPw ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                  onChange={e => set("password", e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-500)",
                    fontSize: 14, padding: 0,
                  }}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 2,
                                background: "var(--bg-600)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width:      pwStrength.width,
                      background: pwStrength.color,
                      transition: "width 0.3s, background 0.3s",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.7rem", color: pwStrength.color,
                                marginTop: 3, fontWeight: 500 }}>
                    {pwStrength.label}
                  </div>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" required error={touched.confirmPassword && errors.confirmPassword}>
              <div style={{ position: "relative" }}>
                <input
                  className={`input ${touched.confirmPassword && errors.confirmPassword ? "input-error" : ""}`}
                  type={showCPw ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                  onChange={e => set("confirmPassword", e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, confirmPassword: true }))}
                />
                <button
                  type="button"
                  onClick={() => setShowCPw(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-500)",
                    fontSize: 14, padding: 0,
                  }}
                >
                  {showCPw ? "🙈" : "👁"}
                </button>
              </div>

              {/* Match indicator */}
              {form.confirmPassword && form.password && (
                <span style={{
                  fontSize: "0.7rem", marginTop: 3,
                  color: form.password === form.confirmPassword
                    ? "var(--green)" : "var(--red)",
                }}>
                  {form.password === form.confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords don't match"}
                </span>
              )}
            </Field>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              style={{ marginTop: 6, justifyContent: "center", padding: "11px" }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ────────────────── STEP 2: Profile & Role ────────────────── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Role selector */}
            <Field label="I am a" required>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ROLES.map(r => (
                  <label
                    key={r.value}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${form.role === r.value ? "var(--blue)" : "var(--border)"}`,
                      background: form.role === r.value
                        ? "rgba(59,130,246,.1)" : "var(--bg-700)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={() => set("role", r.value)}
                      style={{ accentColor: "var(--blue)", width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-500)" }}>
                        {r.desc}
                      </div>
                    </div>
                    {form.role === r.value && (
                      <span style={{ color: "var(--blue)", fontSize: 16 }}>✓</span>
                    )}
                  </label>
                ))}
              </div>
            </Field>

            {/* Organization */}
            <Field
              label="Organization / Agency"
              required={["responder", "ngo"].includes(form.role)}
              error={touched.organization && errors.organization}
              hint={
                ["responder", "ngo"].includes(form.role)
                  ? "Required for your role"
                  : "Optional"
              }
            >
              <input
                className="input"
                type="text"
                placeholder="e.g. NDRF, Red Cross, City Police"
                value={form.organization}
                maxLength={200}
                onChange={e => set("organization", e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, organization: true }))}
              />
            </Field>

            {/* Badge ID — responder only */}
            {form.role === "responder" && (
              <Field
                label="Badge / Employee ID"
                error={errors.badgeId}
                hint="Your official government / agency ID"
              >
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. NDRF-2024-0042"
                  value={form.badgeId}
                  maxLength={50}
                  onChange={e => set("badgeId", e.target.value)}
                />
              </Field>
            )}

            {/* Phone */}
            <Field
              label="Phone Number"
              error={touched.phone && errors.phone}
              hint="For emergency coordination"
            >
              <input
                className="input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                maxLength={15}
                onChange={e => set("phone", e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              />
            </Field>

            {/* API error */}
            {apiErr && (
              <div style={{
                background: "rgba(239,68,68,.12)",
                border: "1px solid rgba(239,68,68,.3)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                color: "var(--red)", fontSize: "0.82rem",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span>⚠</span>
                <span>{apiErr}</span>
              </div>
            )}

            {/* Terms */}
            <p style={{
              fontSize: "0.7rem", color: "var(--text-500)",
              lineHeight: 1.5, textAlign: "center",
            }}>
              By creating an account you agree to use ResQLink only for
              legitimate emergency response purposes. False alerts are a
              criminal offense.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={busy}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: "center", padding: "11px" }}
                disabled={busy}
              >
                {busy
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</>
                  : " Create Account"
                }
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Footer */}
      <div style={{
        marginTop: 24, paddingTop: 18,
        borderTop: "1px solid var(--border)",
        textAlign: "center",
        fontSize: "0.8rem", color: "var(--text-500)",
      }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--blue)", fontWeight: 500 }}>
          Sign In
        </Link>
        <div style={{ marginTop: 10 }}>
          <Link to="/" style={{ color: "var(--text-500)", fontSize: "0.75rem" }}>
            View Public Dashboard →
          </Link>
        </div>
      </div>

    </PageWrapper>
  );
}