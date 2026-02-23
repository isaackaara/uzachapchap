import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram_handle: string | null;
  total_spent: number;
  order_count: number;
  tags: string[];
  created_at: string;
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

type SortKey = 'name' | 'order_count' | 'total_spent';

function formatKES(amount: number): string {
  return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function isVIP(customer: Customer): boolean {
  return Number(customer.total_spent) > 10000 || customer.order_count > 5;
}

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (debouncedSearch) params.set('search', debouncedSearch);

  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ['customers', page, debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.get<CustomersResponse>(`/customers?${params.toString()}`);
      return res.data;
    },
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400) as unknown as number;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...(data?.customers ?? [])].sort((a, b) => {
    const aVal = sortKey === 'total_spent' ? Number(a.total_spent) : sortKey === 'order_count' ? a.order_count : a.name.toLowerCase();
    const bVal = sortKey === 'total_spent' ? Number(b.total_spent) : sortKey === 'order_count' ? b.order_count : b.name.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;
  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>Customers</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            {data ? `${data.total} total customers` : ''}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="🔍 Search by name, phone, email..."
          style={{
            padding: '9px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            width: 280,
            outline: 'none',
          }}
        />
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
              <th
                onClick={() => handleSort('name')}
                style={thStyle}
              >
                Name{sortArrow('name')}
              </th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Instagram</th>
              <th
                onClick={() => handleSort('order_count')}
                style={thStyle}
              >
                Orders{sortArrow('order_count')}
              </th>
              <th
                onClick={() => handleSort('total_spent')}
                style={thStyle}
              >
                Total Spent{sortArrow('total_spent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Loading...
                </td>
              </tr>
            ) : !sorted.length ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No customers found
                </td>
              </tr>
            ) : (
              sorted.map((customer) => (
                <tr
                  key={customer.id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{customer.name}</span>
                      {isVIP(customer) && (
                        <span title="VIP Customer" style={{ fontSize: 16 }}>⭐</span>
                      )}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 13 }}>
                      {customer.phone && <div>{customer.phone}</div>}
                      {customer.email && <div style={{ color: '#64748b' }}>{customer.email}</div>}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {customer.instagram_handle ? (
                      <span style={{ color: '#E1306C', fontWeight: 500 }}>
                        @{customer.instagram_handle}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{customer.order_count}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#4F46E5' }}>
                    {formatKES(customer.total_spent)}
                  </td>
                </tr>
              ))
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
  cursor: 'pointer',
  userSelect: 'none',
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

declare global {
  interface Window { _searchTimeout: number; }
}
