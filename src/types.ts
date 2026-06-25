export interface ChatMessage {
  id: string;
  sender_email: string;
  receiver_email: string;
  content: string;
  timestamp: string;
  is_dns_mode: boolean;
  dns_packet_count: number;
  dns_subdomain?: string;
  status: 'sent' | 'received' | 'pending' | 'failed';
}

export interface ChatUser {
  email: string;
  nickname: string;
  phone_number?: string;
  bio?: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'dns_only';
}

export interface DNSLog {
  id: string;
  timestamp: string;
  query_type: 'TXT' | 'A' | 'AAAA' | 'RAW';
  domain: string;
  bytes_transferred: number;
  direction: 'TX' | 'RX';
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
  payload: string;
}

export interface DeploymentStatus {
  status: 'idle' | 'cloning' | 'copying' | 'pushing' | 'success' | 'failed';
  message: string;
  timestamp: string;
}
