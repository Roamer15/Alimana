import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';

dotenv.config();

const isCompiled = __filename.endsWith('.js'); // détecte prod ou dev

const databaseUrl =
  process.env.DATABASE_URL || 'postgres://postgres:connexion45@localhost:5432/alimanadbtest';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: databaseUrl.includes('localhost')
    ? false
    : {
        rejectUnauthorized: false,
      },
  entities: [isCompiled ? 'dist/entities/**/*.entity.js' : 'src/entities/**/*.entity.ts'],
  migrations: [isCompiled ? 'dist/database/migrations/**/*.js' : 'src/database/migrations/**/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
