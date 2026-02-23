import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { colors } from '../../theme';

interface AnalyticsSummary {
  totalRevenue: number;
  orderCount: number;
  soldToday: number;
  topProducts: Array<{ id: string; title: string; revenue: number }>;
}

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, icon, loading, valueColor }: { label: string; value: string; icon: string; loading: boolean; valueColor?: string }) {
  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: 12,
        padding: '24px',
        border: `1px solid ${colors.border}`,
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
            background: colors.border,
            borderRadius: 6,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <div style={{ fontSize: 24, fontWeight: 800, color: valueColor ?? colors.text }}>{value}</div>
      )}
      <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>{label}</div>
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
      <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: colors.text }}>Dashboard</h1>
      <p style={{ margin: '0 0 24px', color: colors.textSecondary, fontSize: 14 }}>
        Your business at a glance
      </p>

      {error && (
        <div
          style={{
            background: colors.errorBg,
            color: colors.error,
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
          valueColor={colors.secondary}
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
          valueColor={colors.success}
        />
      </div>

      {/* Top Products */}
      <div
        style={{
          background: colors.surface,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: colors.text }}>Top Products by Revenue</h2>
        {isLoading ? (
          <div style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</div>
        ) : !data?.topProducts?.length ? (
          <div style={{ color: colors.textMuted, fontSize: 14 }}>No data yet. Start adding products!</div>
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
                  borderBottom: i < data.topProducts.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      background: colors.primary,
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
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{product.title}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.secondary }}>
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
