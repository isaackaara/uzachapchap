import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import { colors } from '../../theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { mutate: forgotPassword, isPending, error, isSuccess } = useForgotPassword();

  const errorMsg =
    error instanceof AxiosError
      ? (error.response?.data as { error?: string })?.error ?? error.message
      : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    forgotPassword({ email });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ UzaChapChap</div>
        <h1 style={styles.title}>Reset password</h1>
        <p style={styles.subtitle}>
          Enter your email and we'll send you a reset link
        </p>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        {isSuccess ? (
          <div style={styles.successBox}>
            If that email is registered, you'll receive a reset link shortly. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
            <button type="submit" disabled={isPending} style={styles.button}>
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bg,
    padding: 16,
  },
  card: {
    background: colors.surface,
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    border: `1px solid ${colors.border}`,
  },
  logo: { fontSize: 22, fontWeight: 800, color: colors.primary, marginBottom: 24, textAlign: 'center' },
  title: { margin: '0 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center', color: colors.text },
  subtitle: { margin: '0 0 24px', color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  errorBox: {
    background: colors.errorBg,
    color: colors.error,
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 14,
  },
  successBox: {
    background: colors.successBg,
    color: colors.success,
    borderRadius: 8,
    padding: '14px',
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 1.5,
  },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 },
  input: {
    padding: '10px 12px',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    outline: 'none',
    background: colors.bg,
    color: colors.text,
  },
  button: {
    padding: '12px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginBottom: 16,
  },
  footer: { textAlign: 'center', fontSize: 14, color: colors.textSecondary, margin: 0 },
  link: { color: colors.primary, textDecoration: 'none', fontWeight: 600 },
};
