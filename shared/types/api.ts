export interface ApiResponse<T = void> {
  success: true;
  data?: T;
}

export interface ApiError {
  error: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
