import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface Channel {
  id: string;
  platform: 'instagram' | 'whatsapp' | 'tiktok';
  username: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

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
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await apiClient.get<Channel[]>('/channels');
      return res.data;
    },
  });

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/channels/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const handleConnectInstagram = () => {
    const appId = import.meta.env['VITE_INSTAGRAM_APP_ID'] as string | undefined;
    const redirectUri = encodeURIComponent(`${window.location.origin}/settings/channels`);
    if (!appId) {
      alert('Instagram App ID not configured. Set VITE_INSTAGRAM_APP_ID in .env');
      return;
    }
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_manage_messages,pages_read_engagement&response_type=code`;
    window.location.href = oauthUrl;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>Channels</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            Manage your connected social channels
          </p>
        </div>
        <button
          onClick={handleConnectInstagram}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
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
      </div>

      {isLoading ? (
        <div style={{ color: '#94a3b8', fontSize: 14, padding: 24 }}>Loading channels...</div>
      ) : !channels?.length ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>No channels connected</h3>
          <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
            Connect your Instagram account to start managing your sales
          </p>
          <button
            onClick={handleConnectInstagram}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
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
                background: '#fff',
                borderRadius: 12,
                padding: '20px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
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
                  <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
                    {channel.platform}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: channel.is_active ? '#dcfce7' : '#fee2e2',
                      color: channel.is_active ? '#15803d' : '#dc2626',
                    }}
                  >
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {channel.username ? `@${channel.username}` : 'Unknown handle'}
                  {' · '}
                  Connected {formatDate(channel.connected_at)}
                </div>
              </div>

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
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
