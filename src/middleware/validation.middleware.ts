import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);
      
      // Replace with validated (and possibly transformed) data
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues as ZodIssue[];
        const formattedErrors = issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        }));
        
        next(new ValidationError('Validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Validate multiple sources at once
 */
export const validateRequest = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: Array<{ field: string; code: string; message: string }> = [];

      // Validate each source
      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[source as 'body' | 'query' | 'params'];
            const validated = await schema.parseAsync(data);
            req[source as 'body' | 'query' | 'params'] = validated;
          } catch (error) {
            if (error instanceof ZodError) {
              const issues = error.issues as ZodIssue[];
              errors.push(
                ...issues.map((issue: ZodIssue) => ({
                  field: `${source}.${issue.path.join('.')}`,
                  code: issue.code,
                  message: issue.message,
                }))
              );
            } else {
              throw error;
            }
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
