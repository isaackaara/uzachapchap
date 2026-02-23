import { useState, FormEvent } from 'react';
import { useChannels, useMockConnect, useSyncChannel, useDisconnectChannel } from '../../hooks/useChannels';
import { colors } from '../../theme';
import { AxiosError } from 'axios';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  tiktok: '🎵',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Channels() {
  const [username, setUsername] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);

  const { data: channels, isLoading } = useChannels();
  const { mutate: mockConnect, isPending: isConnecting, error: connectError } = useMockConnect();
  const { mutate: syncChannel, isPending: isSyncing, variables: syncingId, data: syncResult } = useSyncChannel();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectChannel();

  const connectErrorMsg =
    connectError instanceof AxiosError
      ? (connectError.response?.data as { error?: string })?.error ?? connectError.message
      : null;

  const handleConnect = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    mockConnect(username.trim(), {
      onSuccess: () => {
        setUsername('');
        setShowConnectForm(false);
      },
    });
  };

  const instagramChannels = channels?.filter((c) => c.platform === 'instagram') ?? [];
  const hasInstagram = instagramChannels.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: colors.text }}>Channels</h1>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
            Manage your connected social channels
          </p>
        </div>
        {!hasInstagram && !showConnectForm && (
          <button
            onClick={() => setShowConnectForm(true)}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${colors.primary}, #E6443C)`,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            📸 Connect Instagram
          </button>
        )}
      </div>

      {/* Connect Form */}
      {showConnectForm && !hasInstagram && (
        <div
          style={{
            background: colors.surface,
            borderRadius: 12,
            padding: 24,
            border: `1px solid ${colors.border}`,
            marginBottom: 24,
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: colors.text }}>
            Connect Instagram Account
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.textSecondary }}>
            Enter your Instagram username to connect in mock mode. Your posts will be simulated with sample Kenyan thrift products.
          </p>

          {connectErrorMsg && (
            <div style={{ background: colors.errorBg, color: colors.error, padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
              {connectErrorMsg}
            </div>
          )}

          <form onSubmit={handleConnect} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                Instagram Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. thrift_nairobi"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  color: colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting}
              style={{
                padding: '10px 20px',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={() => setShowConnectForm(false)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                color: colors.textSecondary,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ color: colors.textSecondary, fontSize: 14, padding: 24 }}>Loading channels...</div>
      ) : !channels?.length ? (
        <div
          style={{
            background: colors.surface,
            borderRadius: 12,
            padding: '60px 24px',
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: colors.text }}>No channels connected</h3>
          <p style={{ margin: '0 0 24px', color: colors.textSecondary, fontSize: 14 }}>
            Connect your Instagram account to start managing your sales
          </p>
          <button
            onClick={() => setShowConnectForm(true)}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${colors.primary}, #E6443C)`,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            📸 Connect Instagram
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {channels.map((channel) => (
            <div
              key={channel.id}
              style={{
                background: colors.surface,
                borderRadius: 12,
                padding: '20px 24px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 36, flexShrink: 0 }}>
                {PLATFORM_ICONS[channel.platform] ?? '📱'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize', color: colors.text }}>
                    {channel.platform}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: channel.is_active ? colors.successBg : colors.errorBg,
                      color: channel.is_active ? colors.success : colors.error,
                    }}
                  >
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: colors.textSecondary }}>
                  {channel.username ? `@${channel.username}` : 'Unknown handle'}
                  {' · '}
                  Connected {formatDate(channel.connected_at)}
                </div>
                {/* Sync result */}
                {syncResult && syncingId === channel.id && (
                  <div style={{ fontSize: 13, color: colors.success, marginTop: 4 }}>
                    {syncResult.message}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {channel.platform === 'instagram' && (
                  <button
                    onClick={() => syncChannel(channel.id)}
                    disabled={isSyncing}
                    style={{
                      padding: '8px 16px',
                      background: colors.secondary,
                      border: 'none',
                      borderRadius: 8,
                      color: '#0F1419',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSyncing && syncingId === channel.id ? 'Syncing...' : 'Sync Posts'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Disconnect ${channel.platform}? This cannot be undone.`)) {
                      disconnect(channel.id);
                    }
                  }}
                  disabled={isDisconnecting}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.error,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
