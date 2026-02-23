import { Product } from '../hooks/useProducts';
import { colors } from '../theme';

interface ProductCardProps {
  product: Product;
  onMarkSold: (id: string) => void;
  isMarkingSold?: boolean;
}

const statusColors: Record<string, string> = {
  available: colors.success,
  sold: colors.sold,
  reserved: colors.warning,
  hidden: colors.textMuted,
};

const statusBg: Record<string, string> = {
  available: colors.successBg,
  sold: colors.soldBg,
  reserved: colors.warningBg,
  hidden: 'rgba(90, 106, 128, 0.1)',
};

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

export default function ProductCard({ product, onMarkSold, isMarkingSold }: ProductCardProps) {
  const firstImage = product.media_urls?.[0];

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          paddingTop: '75%',
          position: 'relative',
          background: colors.bg,
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
              color: colors.textMuted,
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
            color: statusColors[product.status] ?? colors.textMuted,
            background: statusBg[product.status] ?? colors.soldBg,
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
            color: colors.text,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.title}
        </h3>

        <div style={{ fontSize: 16, fontWeight: 700, color: colors.primary }}>
          {formatKES(product.price)}
        </div>

        <button
          onClick={() => onMarkSold(product.id)}
          disabled={product.status !== 'available' || isMarkingSold}
          style={{
            marginTop: 'auto',
            padding: '10px',
            background: product.status === 'available' ? colors.primary : colors.border,
            color: product.status === 'available' ? '#fff' : colors.textMuted,
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
