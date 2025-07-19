import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { MyLoggerModule } from './my-logger/my-logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Importez les modules du contexte
import { ClsModule } from 'nestjs-cls';
import { RequestContextModule } from './common/context/request-context/request-context.module';
import { PayloadContextMiddleware } from './common/middleware/payload-context.middleware';
import { StoreModule } from './modules/store/store.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { CashRegisterSessionsModule } from './modules/cash-register-sessions/cash-register-sessions.module';
import { StoreSettingModule } from './modules/store-setting/store-setting.module';
// Importez votre middleware de payload

@Module({
  imports: [
    MyLoggerModule,
    AuthModule,
    AppConfigModule,
    StoreModule,
    StoreSettingModule,
    // Configuration de ClsModule au niveau racine
    ClsModule.forRoot({
      global: true, // Rend ClsModule globalement disponible
      middleware: {
        mount: true, // Monte le middleware CLS pour encapsuler chaque requête
        // Options supplémentaires, par exemple pour générer un ID de requête unique
        generateId: true,
        idGenerator: (req: Request) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          req.headers['x-request-id'] || 'unique-id-' + Math.random().toString(36).substring(2, 10),
      },
    }),
    RequestContextModule,
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
        entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],

        logging: configService.typeormLogging,
      }),
    }),
    CashRegisterModule,
    CashRegisterSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PayloadContextMiddleware).forRoutes('*'); // Applique le middleware de payload à toutes les routes
  }
}
