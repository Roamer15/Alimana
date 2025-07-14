import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { MyLoggerModule } from './my-logger/my-logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ClsModule } from 'nestjs-cls';

import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { RequestContextModule } from './common/context/request-context.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true, // Rend le ClsModule disponible globalement
      middleware: {
        mount: true, // Monte le middleware pour gérer le contexte de requête
        // Ajoutez des fonctions pour initialiser le contexte si nécessaire
        generateId: true, // Génère un ID de requête unique
        idGenerator: (req) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15),
      },
    }),
    RequestContextModule,
    MyLoggerModule,
    AuthModule,
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),

        // Pour les environnements de développement (TypeScript)
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        logging: configService.typeormLogging,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
  // exports: [AppConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL }); // Appliquer à toutes les routes
  }
}
