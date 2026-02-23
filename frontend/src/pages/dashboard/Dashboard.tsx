import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface AnalyticsSummary {
  totalRevenue: number;
  orderCount: number;
  soldToday: number;
  topProducts: Array<{ id: string; title: string; revenue: number }>;
}

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, icon, loading }: { label: string; value: string; icon: string; loading: boolean }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      {loading ? (
        <div
          style={{
            height: 32,
            background: '#e2e8f0',
            borderRadius: 6,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{value}</div>
      )}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsSummary>('/analytics/summary');
      return res.data;
    },
  });

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
        Your business at a glance
      </p>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Failed to load analytics. Check your connection.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Total Revenue"
          value={data ? formatKES(data.totalRevenue) : '—'}
          icon="💰"
          loading={isLoading}
        />
        <StatCard
          label="Total Orders"
          value={data ? String(data.orderCount) : '—'}
          icon="📦"
          loading={isLoading}
        />
        <StatCard
          label="Sold Today"
          value={data ? String(data.soldToday) : '—'}
          icon="🔥"
          loading={isLoading}
        />
      </div>

      {/* Top Products */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Top Products by Revenue</h2>
        {isLoading ? (
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : !data?.topProducts?.length ? (
          <div style={{ color: '#94a3b8', fontSize: 14 }}>No data yet. Start adding products!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.topProducts.map((product, i) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < data.topProducts.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      background: '#4F46E5',
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{product.title}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>
                  {formatKES(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
