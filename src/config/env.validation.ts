import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_NAME: Joi.string().required(),
  TYPEORM_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),

  // Auth
  // JWT_SECRET: Joi.string().min(16).required(),
  // JWT_EXPIRES_IN: Joi.string().default('1d'),

  // // Mailing
  // MAIL_HOST: Joi.string().required(),
  // MAIL_PORT: Joi.number().required(),
  // MAIL_USER: Joi.string().required(),
  // MAIL_PASSWORD: Joi.string().required(),
  // Ajoutez d'autres variables ici si besoin
});
