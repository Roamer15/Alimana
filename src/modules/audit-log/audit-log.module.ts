import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MyLoggerModule } from 'src/my-logger/my-logger.module'; // Importez le module du logger
import { RequestContextService } from 'src/common/context/request-context.service'; // Importez le service de contexte
import { ClsModule } from 'nestjs-cls'; // Importez ClsModule si vous ne l'avez pas déjà fait globalement
import { AuditLogController } from './audit-log.controller';
import { AuditLog } from 'src/entities/audit-logs.entity';
import { AuditLogService } from './audit-log.service';
import * as AuditSubscribers from './subscribers';

// Importez tous vos subscribers individuels

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]), // Enregistrez l'entité AuditLog pour ce module
    MyLoggerModule, // Pour que AuditLogsService et AuditSubscriber puissent utiliser MyLoggerService
    ClsModule,
  ],
  providers: [
    AuditLogService, // Le service qui gère la persistance des logs
    RequestContextService, // Le service pour gérer le contexte de la requête

    ...Object.values(AuditSubscribers),
  ],
  controllers: [AuditLogController],
  exports: [AuditLogService], // Exportez si d'autres modules doivent les utiliser comme authModule
})
export class AuditLogModule {}
