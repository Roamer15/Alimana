import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

//  Strong typing
interface EnvVars {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  TYPEORM_LOGGING: boolean;
}

// Schema Declaration
const envSchema = Joi.object<EnvVars>({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_NAME: Joi.string().required(),
  TYPEORM_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown();

// No destructuring → store the result in a typed variable
const validated = envSchema.validate(process.env, { abortEarly: false });

if (validated.error) {
  throw new Error(` Erreurs dans les variables d'environnement :\n${validated.error.message}`);
}

const env: EnvVars = validated.value; // Explicit typing, no more `any`

// Normal use
const isTsEnv = __filename.endsWith('.ts');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [isTsEnv ? 'src/entities/**/*.entity.ts' : 'dist/entities/**/*.entity.js'],
  migrations: [isTsEnv ? 'src/database/migrations/**/*.ts' : 'dist/database/migrations/**/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: env.TYPEORM_LOGGING,
});
