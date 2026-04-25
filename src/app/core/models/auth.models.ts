export interface AuthRequest {
  userId: string;
  authCode: string;
  checksum: string;
}

export interface UserSession {
  userId?: string;
  sessionId?: string;
  userName?: string;
  email?: string;
  mobileNumber?: string;
  pan?: string;
  accountType?: string;
  enabledExchanges?: string[];
  enabledProducts?: string[];
  accountStatus?: string
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginInitiatePayload {
  appCode: string;
}
