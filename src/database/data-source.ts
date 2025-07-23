import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';

dotenv.config();

const isCompiled = __filename.endsWith('.js'); // détecte prod ou dev

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: true, // Add this line
  extra: {
    ssl: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  },
  entities: [isCompiled ? 'dist/entities/**/*.entity.js' : 'src/entities/**/*.entity.ts'],
  migrations: [isCompiled ? 'dist/database/migrations/**/*.js' : 'src/database/migrations/**/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
