import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: '#1a1a2e',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '24px 20px',
            fontSize: 20,
            fontWeight: 700,
            color: '#6C63FF',
            borderBottom: '1px solid #2d2d4e',
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
                color: isActive ? '#fff' : '#aaa',
                background: isActive ? '#6C63FF22' : 'transparent',
                borderLeft: isActive ? '3px solid #6C63FF' : '3px solid transparent',
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
            borderTop: '1px solid #2d2d4e',
            fontSize: 13,
            color: '#aaa',
          }}
        >
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{seller?.name}</div>
          <div style={{ marginBottom: 4 }}>{seller?.email}</div>
          <div
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 12,
              background: seller?.plan === 'pro' ? '#6C63FF' : '#444',
              color: '#fff',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
        {/* Header */}
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e0e0e0',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 14, color: '#666' }}>
            {seller?.businessName ?? seller?.name}
          </span>
          <button
            onClick={() => void handleLogout()}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              color: '#666',
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
