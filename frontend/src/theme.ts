// UzaChapChap Dark Theme - Single source of truth for colors
export const colors = {
  // Brand
  primary: '#FF6B5B',       // Coral
  primaryHover: '#FF8577',
  secondary: '#00D9D9',     // Teal
  secondaryHover: '#33E3E3',

  // Backgrounds
  bg: '#0F1419',            // Navy (main background)
  surface: '#1C2530',       // Cards, panels
  surfaceHover: '#243040',
  sidebar: '#0D1117',       // Darker sidebar
  header: '#151D26',        // Header bar

  // Borders
  border: '#2D3748',
  borderLight: '#374357',

  // Text
  text: '#E8EAED',          // Primary text
  textSecondary: '#8B9BB4', // Muted text
  textMuted: '#5A6A80',     // Very muted

  // Status
  success: '#2EFF72',       // Bright green
  successBg: 'rgba(46, 255, 114, 0.12)',
  error: '#FF4757',
  errorBg: 'rgba(255, 71, 87, 0.12)',
  warning: '#FFB347',
  warningBg: 'rgba(255, 179, 71, 0.12)',
  sold: '#5A6A80',
  soldBg: 'rgba(90, 106, 128, 0.15)',
} as const;
