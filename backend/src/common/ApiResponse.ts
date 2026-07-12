import { Response } from 'express';

interface SuccessPayload<T> {
  success: true;
  data: T;
  message?: string;
}

interface PaginatedPayload<T> {
  success: true;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

export class ApiResponse {
  /**
   * Standard success response
   */
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const payload: SuccessPayload<T> = {
      success: true,
      data,
      ...(message && { message }),
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Created (201) response
   */
  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Paginated list response
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): Response {
    const payload: PaginatedPayload<T> = {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      ...(message && { message }),
    };
    return res.status(200).json(payload);
  }

  /**
   * No-content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
