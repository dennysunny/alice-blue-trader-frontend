export interface TradingProfile {
  clientId: string;
  clientName: string;
  isTotpEnabled: 'Y' | 'N';
  isPoaProvided: 'Y' | 'N';
  accountStatus: string;
  exchanges: string[];
  products: string[];
  orderComplexity: string[];
}
