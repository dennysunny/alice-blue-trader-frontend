import {
  OptionChainExchange,
  OptionChainInterval,
} from '../../features/stock-detail/configs/stock.enum';

export interface GetUnderlyingRequest {
  exch: OptionChainExchange;
}

export interface GetUnderlyingExpiryRequest {
  underlying: string;
  exch: OptionChainExchange;
}

export interface GetOptionChainRequest {
  underlying: string;
  expiry: string;
  interval: OptionChainInterval;
  exch: OptionChainExchange;
}

export interface GetUnderlyingResponse {
  status: string;
  message: string;
  result: [{ list_underlying: string[] }];
}

export interface GetUnderlyingExpiryResponse {
  status: string;
  message: string;
  result: [
    {
      underlying: string;
      underlying_expiry: string[];
    },
  ];
}

export interface OptionContractRaw {
  forInsName: string;
  gval: string;
  ltp: string;
  oi: string;
  pdc: string; // previous day close
  pdoi: string; // previous day OI
  token: string;
  tradingsymbol: string;
}

export interface OptionChainRow {
  CE?: OptionContractRaw;
  PE?: OptionContractRaw;
}

export interface GetOptionChainResponse {
  status: string;
  message: string;
  result: [{ data: OptionChainRow[] }];
}

export interface OptionContractView {
  token: string;
  tradingsymbol: string;
  forInsName: string;
  ltp: number;
  pdc: number;
  change: number;
  changePct: number;
  oi: number;
  pdoi: number;
  oiChange: number;
  gval: number;
}

export interface OptionChainRowView {
  strikePrice: number;
  CE?: OptionContractView;
  PE?: OptionContractView;
  isAtm: boolean;
}
