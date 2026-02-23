import { useState } from 'react';
import { useProducts, useMarkSold } from '../../hooks/useProducts';
import ProductCard from '../../components/ProductCard';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Available', value: 'available' },
  { label: 'Sold', value: 'sold' },
  { label: 'Reserved', value: 'reserved' },
];

export default function ProductList() {
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useProducts({ status: activeStatus, page, limit: 20 });
  const { mutate: markSold, isPending: isMarkingSold, variables: markSoldId } = useMarkSold();

  const handleTabChange = (status: string | undefined) => {
    setActiveStatus(status);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>Products</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            {data ? `${data.total} total products` : ''}
          </p>
        </div>
        <button
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
          onClick={() => alert('Add product form coming soon!')}
        >
          + Add Product
        </button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
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

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
          Failed to load products.
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#e2e8f0',
                borderRadius: 12,
                height: 280,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : !data?.products?.length ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#94a3b8',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>No products yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Add your first product to get started</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {data.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onMarkSold={(id) => markSold(id)}
                isMarkingSold={isMarkingSold && markSoldId === product.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
        </>
      )}
    </div>
  );
}

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
