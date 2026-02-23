import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface Order {
  id: string;
  customer_name: string | null;
  product_title: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  paid: { bg: '#dcfce7', color: '#15803d' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  refunded: { bg: '#f1f5f9', color: '#64748b' },
};

function formatKES(amount: number): string {
  return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrderList() {
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (activeStatus) params.set('status', activeStatus);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, activeStatus],
    queryFn: async () => {
      const res = await apiClient.get<OrdersResponse>(`/orders?${params.toString()}`);
      return res.data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleTabChange = (status: string | undefined) => {
    setActiveStatus(status);
    setPage(1);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>Orders</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          {data ? `${data.total} total orders` : ''}
        </p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => handleTabChange(tab.value)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeStatus === tab.value ? '2px solid #4F46E5' : '2px solid transparent',
              color: activeStatus === tab.value ? '#4F46E5' : '#64748b',
              fontWeight: activeStatus === tab.value ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Loading...
                </td>
              </tr>
            ) : !data?.orders?.length ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              data.orders.map((order) => {
                const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#f1f5f9', color: '#64748b' };
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                        #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>{order.customer_name ?? '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.product_title ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#4F46E5' }}>
                      {formatKES(order.amount)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 13 }}>
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 16 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={paginationBtn(page === 1)}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', fontSize: 14, color: '#64748b' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={paginationBtn(page === totalPages)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#1e293b',
};

function paginationBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: disabled ? '#f1f5f9' : '#4F46E5',
    color: disabled ? '#94a3b8' : '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 600,
  };
}
