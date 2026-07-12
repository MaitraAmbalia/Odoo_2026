import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../common/ApiError';

/**
 * Generic Zod validation middleware.
 * Pass a Zod schema that validates req.body, req.query, and/or req.params.
 *
 * Usage:
 *   const schema = z.object({ body: z.object({ name: z.string() }) });
 *   router.post('/', validate(schema), controller);
 */
export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      const anyErr = err as any;
      if (anyErr && anyErr.name === 'ZodError') {
        const errors = (anyErr.issues || []).map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new ApiError(400, 'Validation failed', errors));
      } else {
        next(err);
      }
    }
  };
};
