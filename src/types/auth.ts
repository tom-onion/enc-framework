export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

export interface LoginAttempt {
  username: string;
  password: string;
}

export interface LoginLog {
  id: string;
  username: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  loginStatus: 'success' | 'failed';
  failureReason?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  isActive: boolean;
}
