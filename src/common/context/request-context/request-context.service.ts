/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

// Interface pour le contexte de la requête
export interface RequestContext {
  readonly storeId: number | null;
  readonly email: string | null;
  readonly canCreateStore: boolean;
  readonly storeUserId: number | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly userId: number | null;
  readonly roleId: number | null;
  readonly roleName: string | null;
  readonly permissions: string[];
  readonly oldValues: Map<string, any>; // Stocke les anciennes valeurs des entités
}

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService<Record<string, any>>) {}

  // Initialise le contexte pour la requête actuelle
  setContext(context: Partial<RequestContext>) {
    this.cls.set('email', context.email ?? null);
    this.cls.set('canCreateStore', context.canCreateStore ?? false);
    this.cls.set('roleId', context.roleId ?? null);
    this.cls.set('permissions', context.permissions ?? []);
    this.cls.set('roleName', context.roleName ?? null);
    this.cls.set('userId', context.userId ?? null);
    this.cls.set('storeId', context.storeId ?? null);
    this.cls.set('storeUserId', context.storeUserId ?? null);
    this.cls.set('ipAddress', context.ipAddress ?? null);
    this.cls.set('userAgent', context.userAgent ?? null);

    // N'initialise la Map que si elle n'existe pas déjà
    if (!this.cls.get('oldValues')) {
      this.cls.set('oldValues', new Map<string, any>());
    }
  }

  // Récupère le contexte complet
  getContext(): RequestContext {
    return {
      email: this.cls.get('email') ?? null,
      canCreateStore: this.cls.get('canCreateStore') ?? false,
      roleId: this.cls.get('roleId') ?? null,
      permissions: this.cls.get('permissions') ?? [],
      userId: this.cls.get('userId') ?? null,
      roleName: this.cls.get('roleName') ?? null,
      storeId: this.cls.get('storeId') ?? null,
      storeUserId: this.cls.get('storeUserId') ?? null,
      ipAddress: this.cls.get('ipAddress') ?? null,
      userAgent: this.cls.get('userAgent') ?? null,
      oldValues: this.cls.get('oldValues') ?? new Map<string, any>(),
    };
  }

  // Stocke l'ancienne valeur d'une entité
  setOldValue(entityId: string, value: any): void {
    let oldValues = this.cls.get('oldValues');
    if (!oldValues) {
      oldValues = new Map<string, any>();
      this.cls.set('oldValues', oldValues);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    oldValues.set(entityId, value);
  }

  // Récupère une ancienne valeur
  getOldValue(entityId: string) {
    const oldValues = this.cls.get('oldValues');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return oldValues?.get(entityId);
  }

  // Supprime une ancienne valeur
  clearOldValue(entityId: string): void {
    const oldValues = this.cls.get('oldValues');
    if (oldValues instanceof Map) {
      oldValues.delete(entityId);
    }
  }
}
