import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../../hooks/useAuth';
import { AxiosError } from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();
  const { mutate: resetPassword, isPending, error, isSuccess } = useResetPassword();

  const apiError =
    error instanceof AxiosError
      ? (error.response?.data as { error?: string })?.error ?? error.message
      : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setValidationError('Invalid or missing reset token');
      return;
    }

    resetPassword({ token, password }, {
      onSuccess: () => {
        setTimeout(() => void navigate('/login'), 2000);
      }
    });
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorBox}>Invalid reset link. Please request a new one.</div>
          <Link to="/forgot-password" style={styles.link}>Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ UzaChapChap</div>
        <h1 style={styles.title}>Set new password</h1>
        <p style={styles.subtitle}>Enter your new password below</p>

        {(validationError || apiError) && (
          <div style={styles.errorBox}>{validationError || apiError}</div>
        )}

        {isSuccess ? (
          <div style={styles.successBox}>
            ✅ Password updated! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
              placeholder="Min 8 characters"
            />

            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Repeat password"
            />

            <button type="submit" disabled={isPending} style={styles.button}>
              {isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>← Back to login</Link>
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
    background: '#f8f9fa',
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logo: { fontSize: 22, fontWeight: 800, color: '#4F46E5', marginBottom: 24, textAlign: 'center' },
  title: { margin: '0 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' },
  subtitle: { margin: '0 0 24px', color: '#64748b', textAlign: 'center', fontSize: 14 },
  errorBox: {
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 14,
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    borderRadius: 8,
    padding: '14px',
    marginBottom: 16,
    fontSize: 14,
  },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    outline: 'none',
  },
  button: {
    padding: '12px',
    background: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginBottom: 16,
  },
  footer: { textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 },
  link: { color: '#4F46E5', textDecoration: 'none', fontWeight: 600 },
};
