import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

// 1. Typage fort
interface EnvVars {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  TYPEORM_LOGGING: boolean;
}

// 2. Déclaration du schéma
const envSchema = Joi.object<EnvVars>({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_NAME: Joi.string().required(),
  TYPEORM_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown();

// ✅ 3. Pas de destructuring → stocker le résultat dans une variable typée
const validated = envSchema.validate(process.env, { abortEarly: false });

if (validated.error) {
  throw new Error(`❌ Erreurs dans les variables d'environnement :\n${validated.error.message}`);
}

const env: EnvVars = validated.value; // ✅ Typage explicite, plus de `any`

// 4. Utilisation normale
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
