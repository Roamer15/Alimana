// // src/config/config.module.ts
// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import * as Joi from 'joi';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true, // accessible partout
//       validationSchema: Joi.object({
//         DB_HOST: Joi.string().required(),
//         DB_PORT: Joi.number().default(5432),
//         DB_USERNAME: Joi.string().required(),
//         DB_PASSWORD: Joi.string().allow(''),
//         DB_NAME: Joi.string().required(),
//         API_KEY: Joi.string().required(),
//         LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
//         FEATURE_FLAG_X: Joi.boolean().default(false),
//         OPTIONAL_VAR: Joi.string().optional(),
//       }),
//       // Optionnel : charger un fichier .env spécifique
//       // envFilePath: '.env.development',
//     }),
//   ],
// })
// export class ConfigValidationModule {}
