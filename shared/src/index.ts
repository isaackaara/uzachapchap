// Enums / literal types
export type ProductStatus = 'available' | 'sold' | 'reserved' | 'hidden';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ChannelPlatform = 'instagram' | 'whatsapp' | 'tiktok';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed';
export type MessageDirection = 'inbound' | 'outbound';

// Entity types
export interface Seller {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  channelId: string | null;
  externalId: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  status: ProductStatus;
  mediaUrls: string[];
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  sellerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
  totalSpent: number;
  orderCount: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  sellerId: string;
  productId: string | null;
  customerId: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  paystackReference: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  sellerId: string;
  platform: ChannelPlatform;
  pageId: string | null;
  username: string | null;
  connectedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  sellerId: string;
  channelId: string | null;
  customerId: string | null;
  externalMessageId: string | null;
  direction: MessageDirection;
  content: string;
  sentAt: string;
  createdAt: string;
}

export interface AutoReply {
  id: string;
  sellerId: string;
  trigger: string;
  template: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  sellerId: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  orderCount: number;
  soldToday: number;
  topProducts: Array<{
    id: string;
    title: string;
    revenue: number;
  }>;
}
