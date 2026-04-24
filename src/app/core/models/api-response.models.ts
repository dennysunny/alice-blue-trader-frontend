import { ApiStatus } from '../enums/api.enums';

export interface ApiResponse<T> {
  status: ApiStatus;
  message: string;
  result: T;
}

export interface UserSessionApiResponse {
  stat: ApiStatus,
  clientId: string,
  userSession: string
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  status: ApiStatus;
  message: string;
  errorCode?: string;
}
