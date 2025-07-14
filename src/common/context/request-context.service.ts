import { Injectable, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

// Interface pour le contexte de la requête
export interface RequestContext {
  storeId: number | null;
  storeUserId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: number | null;
  oldValues: Map<string, any>; // Pour stocker les anciennes valeurs des entités dans les subscribers
  [key: symbol]: any; // signature d'index requise par ClsStore
}

@Injectable({ scope: Scope.REQUEST }) // Scope REQUEST pour un contexte par requête creer un nouveau context par requete
export class RequestContextService {
  constructor(private readonly cls: ClsService<RequestContext>) {}

  // Initialise le contexte pour la requête actuelle
  setContext(context: Partial<RequestContext>) {
    this.cls.set('userId', context.userId ?? null);
    this.cls.set('storeId', context.storeId ?? null);
    this.cls.set('storeUserId', context.storeUserId ?? null);
    this.cls.set('ipAddress', context.ipAddress ?? null);
    this.cls.set('userAgent', context.userAgent ?? null);
    this.cls.set('oldValues', new Map<string, any>()); // Initialise la map des anciennes valeurs
  }

  // Récupère le contexte complet
  getContext(): RequestContext {
    return {
      userId: this.cls.get('userId') ?? null,
      storeId: this.cls.get('storeId') ?? null,
      storeUserId: this.cls.get('storeUserId') ?? null,
      ipAddress: this.cls.get('ipAddress') ?? null,
      userAgent: this.cls.get('userAgent') ?? null,
      oldValues: this.cls.get('oldValues') ?? new Map<string, any>(),
    };
  }

  // Méthodes pour gérer les anciennes valeurs des entités
  setOldValue(entityId: string, value: any) {
    const oldValues = this.cls.get('oldValues');
    if (oldValues) {
      oldValues.set(entityId, value);
      this.cls.set('oldValues', oldValues);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  getOldValue(entityId: string): any | undefined {
    const oldValues = this.cls.get('oldValues');
    return oldValues?.get(entityId);
  }

  clearOldValue(entityId: string): void {
    const oldValues = this.cls.get('oldValues');
    if (oldValues instanceof Map) {
      oldValues.delete(entityId);
    }
  }
}
