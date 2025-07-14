import { AuditActionType } from 'src/entities/audit-logs.entity';

export class EntityChangeTracker<T extends Record<string, any>> {
  private changedFields: string[] = [];
  private oldValues: Record<string, any> = {};
  private newValues: Record<string, any> = {};
  private notes: string[] = [];

  constructor(
    private readonly entityName: string,
    private readonly entityId: string,
    private readonly oldEntity: T,
    private readonly newEntity: T,
  ) {}

  /**
   * Compare un champ primitif ou simple.
   */
  compareField<K extends keyof T>(field: K, label?: string) {
    const oldVal = this.oldEntity[field];
    const newVal = this.newEntity[field];
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    if (hasChanged) {
      const key = String(field);
      this.changedFields.push(key);
      this.oldValues[key] = oldVal;
      this.newValues[key] = newVal;
      this.notes.push(
        `${label ?? key} changé de '${this.stringify(oldVal)}' à '${this.stringify(newVal)}'`,
      );
    }

    return hasChanged;
  }

  /**
   * Compare une relation en extrayant une clé spécifique (par exemple, id, name).
   */
  compareRelation<K extends keyof T>(field: K, label: string, extractor: (relation: T[K]) => any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const oldVal = extractor(this.oldEntity[field]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newVal = extractor(this.newEntity[field]);
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    if (hasChanged) {
      const key = String(field);
      this.changedFields.push(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.oldValues[key] = oldVal;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.newValues[key] = newVal;
      this.notes.push(
        `${label} changé de '${this.stringify(oldVal)}' à '${this.stringify(newVal)}'`,
      );
    }

    return hasChanged;
  }

  /**
   * Ajoute une note personnalisée au log.
   */
  addNote(note: string) {
    this.notes.push(note);
  }

  hasChanges() {
    return this.changedFields.length > 0;
  }

  getChangedFields() {
    return this.changedFields;
  }

  getOldValues() {
    return this.oldValues;
  }

  getNewValues() {
    return this.newValues;
  }

  getNotes() {
    return this.notes.join(' ');
  }

  /**
   * Formate les valeurs pour les notes (null, dates, objets, etc.)
   */
  private stringify(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Génère un objet prêt à être utilisé pour un audit log.
   */
  getAuditLogPayload(context: {
    storeId: number | null;
    storeUserId: number | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    actionType: AuditActionType;
    notes?: string; // ✅ ajouter ceci
  }) {
    return {
      ...context,
      entity: this.entityName,
      entityId: this.entityId,
      oldValue: this.oldValues,
      newValue: this.newValues,
      notes: context.notes ?? this.getNotes(), // ou utiliser this.getNotes() directement
    };
  }
}
