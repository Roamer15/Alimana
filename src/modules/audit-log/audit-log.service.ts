import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditActionType } from '../../entities/audit-logs.entity'; // Assurez-vous que le chemin est correct et importez AuditActionType
import { MyLoggerService } from 'src/my-logger/my-logger.service';

interface CreateAuditLogDto {
  storeId: number | null;
  storeUserId: number | null;
  actionType: AuditActionType;
  entity: string;
  entityId: string; // Type string pour la flexibilité
  oldValue?: object | null;
  newValue?: object | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  notes?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private readonly logger: MyLoggerService,
  ) {}

  async createAuditLog(data: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...data,
        oldValue: data.oldValue ? (JSON.parse(JSON.stringify(data.oldValue)) as object) : null,
        newValue: data.newValue ? (JSON.parse(JSON.stringify(data.newValue)) as object) : null,
      });
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to create audit log: ${err.message}`,
        err.stack,
        'AuditLogsService',
      );
      return null;
    }
  }

  // Méthodes pour récupérer les logs (pour une interface d'administration)
  async findAuditLogs(
    storeId: number,
    filters?: {
      actionType?: AuditActionType;
      entity?: string;
      entityId?: string;
      storeUserId?: number;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: { page: number; limit: number },
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .where('auditLog.storeId = :storeId', { storeId });

    if (filters?.actionType)
      query.andWhere('auditLog.actionType = :actionType', { actionType: filters.actionType });
    if (filters?.entity) query.andWhere('auditLog.entity = :entity', { entity: filters.entity });
    if (filters?.entityId)
      query.andWhere('auditLog.entityId = :entityId', { entityId: filters.entityId });
    if (filters?.storeUserId)
      query.andWhere('auditLog.storeUserId = :storeUserId', { storeUserId: filters.storeUserId });
    if (filters?.startDate)
      query.andWhere('auditLog.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters?.endDate)
      query.andWhere('auditLog.createdAt <= :endDate', { endDate: filters.endDate });

    if (pagination) {
      query.skip((pagination.page - 1) * pagination.limit);
      query.take(pagination.limit);
    }

    return query.getMany();
  }
}
