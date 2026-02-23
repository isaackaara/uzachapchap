import { Product } from '../hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onMarkSold: (id: string) => void;
  isMarkingSold?: boolean;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  sold: '#94a3b8',
  reserved: '#f59e0b',
  hidden: '#e2e8f0',
};

const statusBg: Record<string, string> = {
  available: '#dcfce7',
  sold: '#f1f5f9',
  reserved: '#fef3c7',
  hidden: '#f8fafc',
};

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

export default function ProductCard({ product, onMarkSold, isMarkingSold }: ProductCardProps) {
  const firstImage = product.media_urls?.[0];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          paddingTop: '75%',
          position: 'relative',
          background: '#f1f5f9',
          flexShrink: 0,
        }}
      >
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              color: '#cbd5e1',
            }}
          >
            🛍️
          </div>
        )}

        {/* Status badge */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: statusColors[product.status] ?? '#666',
            background: statusBg[product.status] ?? '#f1f5f9',
          }}
        >
          {product.status}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#1e293b',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.title}
        </h3>

        <div style={{ fontSize: 16, fontWeight: 700, color: '#4F46E5' }}>
          {formatKES(product.price)}
        </div>

        <button
          onClick={() => onMarkSold(product.id)}
          disabled={product.status !== 'available' || isMarkingSold}
          style={{
            marginTop: 'auto',
            padding: '10px',
            background: product.status === 'available' ? '#4F46E5' : '#e2e8f0',
            color: product.status === 'available' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: product.status === 'available' ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {isMarkingSold ? 'Marking...' : '✓ Mark as SOLD'}
        </button>
      </div>
    </div>
  );
}
