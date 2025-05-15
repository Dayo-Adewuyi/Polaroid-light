import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { ApiError } from '../types';

export const validate = (schema: ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errors));
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errors));
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errors));
    }

    req.params = value;
    next();
  };
};

export const filmSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    description: Joi.string().trim().min(1).max(1000).required(),
    price: Joi.number().integer().min(0).max(999999).required(),
    videoUrl: Joi.string().uri().required(),
    uploadedBy: Joi.string().optional() 
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    description: Joi.string().trim().min(1).max(1000).optional(),
    price: Joi.number().integer().min(0).max(999999).optional(),
    videoUrl: Joi.string().uri().optional()
  }).min(1),

  search: Joi.object({
    q: Joi.string().trim().min(1).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  priceRange: Joi.object({
    minPrice: Joi.number().integer().min(0).default(0),
    maxPrice: Joi.number().integer().min(0).max(999999).default(999999),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }).custom((value, helpers) => {
    if (value.minPrice > value.maxPrice) {
      return helpers.error('minPrice must be less than or equal to maxPrice');
    }
    return value;
  }),

  purchase: Joi.object({
    userId: Joi.string().required()
    })
};

export const userSchemas = {
  create: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    name: Joi.string().trim().min(1).max(100).required()
  }),

  update: Joi.object({
    email: Joi.string().email().lowercase().trim().optional(),
    name: Joi.string().trim().min(1).max(100).optional()
  }).min(1),

  queryByEmail: Joi.object({
    email: Joi.string().email().required()
  })
};

export const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  id: Joi.object({
    id: Joi.string().uuid().required()
  }),

  userId: Joi.object({
    userId: Joi.string().uuid().required()
  }),

  filmId: Joi.object({
    filmId: Joi.string().uuid().required()
  }),

};

export const filmValidation = {
  create: validate(filmSchemas.create),
  update: validate(filmSchemas.update),
  search: validateQuery(filmSchemas.search),
  priceRange: validateQuery(filmSchemas.priceRange),
  id: validateParams(commonSchemas.id),
  purchase: validate(filmSchemas.purchase),
};

export const userValidation = {
  create: validate(userSchemas.create),
  update: validate(userSchemas.update),
  queryByEmail: validateQuery(userSchemas.queryByEmail),
  id: validateParams(commonSchemas.id),
  userId: validateParams(commonSchemas.userId)
};
