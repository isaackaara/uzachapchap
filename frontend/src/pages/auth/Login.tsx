import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import { colors } from '../../theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();

  const errorMsg =
    error instanceof AxiosError
      ? (error.response?.data as { error?: string })?.error ?? error.message
      : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password }, { onSuccess: () => void navigate('/dashboard') });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ UzaChapChap</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your seller dashboard</p>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={styles.input}
            placeholder="••••••••"
          />

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isPending} style={styles.button}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Sign up
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
