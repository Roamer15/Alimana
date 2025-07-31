import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
dotenv.config();
const isTsEnv = __filename.endsWith('.ts');
// Fallback to DATABASE_URL if provided
const databaseUrl =
  process.env.DATABASE_URL || 'postgres://postgres:connexion45@localhost:5432/alimanadb';
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // required for most hosted providers like Koyeb
  },
  entities: isTsEnv ? ['src/entities/**/*.entity.ts'] : ['dist/entities/**/*.entity.js'],
  migrations: isTsEnv ? ['src/database/migrations/**/*.ts'] : ['dist/database/migrations/**/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
