import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';
import { colors } from '../theme';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Products', path: '/products', icon: '🛍️' },
  { label: 'Customers', path: '/customers', icon: '👥' },
  { label: 'Orders', path: '/orders', icon: '📦' },
  { label: 'Channels', path: '/settings/channels', icon: '📡' },
];

export default function Layout() {
  const seller = useAuthStore((s) => s.seller);
  const { refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Continue logout even if API call fails
    }
    logout();
    void navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: colors.bg }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: colors.sidebar,
          color: colors.text,
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          flexShrink: 0,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '24px 20px',
            fontSize: 20,
            fontWeight: 700,
            color: colors.primary,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          ⚡ UzaChapChap
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                color: isActive ? colors.text : colors.textSecondary,
                background: isActive ? `${colors.primary}18` : 'transparent',
                borderLeft: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
                textDecoration: 'none',
                fontSize: 15,
                transition: 'all 0.15s',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${colors.border}`,
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4 }}>{seller?.name}</div>
          <div style={{ marginBottom: 4 }}>{seller?.email}</div>
          <div
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 12,
              background: seller?.plan === 'pro' ? colors.primary : colors.border,
              color: colors.text,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {seller?.plan ?? 'free'}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* Header */}
        <header
          style={{
            background: colors.header,
            borderBottom: `1px solid ${colors.border}`,
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 14, color: colors.textSecondary }}>
            {seller?.businessName ?? seller?.name}
          </span>
          <button
            onClick={() => void handleLogout()}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              color: colors.textSecondary,
              transition: 'all 0.15s',
            }}
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
