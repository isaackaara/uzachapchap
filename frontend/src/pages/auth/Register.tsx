import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import { AxiosError } from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();

  const errorMsg =
    error instanceof AxiosError
      ? (error.response?.data as { error?: string })?.error ?? error.message
      : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register(
      { name, email, password, business_name: businessName || undefined },
      { onSuccess: () => void navigate('/dashboard') }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ UzaChapChap</div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Start selling smarter on Instagram</p>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            placeholder="Jane Wanjiru"
          />

          <label style={styles.label}>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
            placeholder="jane@example.com"
          />

          <label style={styles.label}>Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={styles.input}
            placeholder="Jane's Fashion (optional)"
          />

          <label style={styles.label}>Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={styles.input}
            placeholder="Min 8 characters"
          />

          <button type="submit" disabled={isPending} style={styles.button}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
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
