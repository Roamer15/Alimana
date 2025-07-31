import { MigrationInterface, QueryRunner } from 'typeorm';
import { Permission } from '../../entities/permission.entity';
// Définir une liste claire des permissions
const defaultPermissions = [
  // Category: Dashboard & Reports
  {
    key: 'access_store_dashboard',
    label: 'Access the store dashboard',
    category: 'Dashboard & Reports',
  },
  {
    key: 'view_financial_reports',
    label: 'View financial reports',
    category: 'Dashboard & Reports',
  },
  { key: 'view_stock_reports', label: 'View stock reports', category: 'Dashboard & Reports' },
  { key: 'view_audit_logs', label: 'View audit logs', category: 'Dashboard & Reports' },
  // Category: Sales & Cash Registers
  { key: 'create_sale', label: 'Make new sales', category: 'Sales & Cash Registers' },
  { key: 'view_sales', label: 'View sales history', category: 'Sales & Cash Registers' },
  { key: 'process_returns', label: 'Handle customer returns', category: 'Sales & Cash Registers' },
  {
    key: 'manage_cash_registers',
    label: 'Manage cash registers',
    category: 'Sales & Cash Registers',
  },
  {
    key: 'open_cash_register_session',
    label: 'Open a cash register session',
    category: 'Sales & Cash Registers',
  },
  {
    key: 'close_cash_register_session',
    label: 'Close a cash register session',
    category: 'Sales & Cash Registers',
  },
  {
    key: 'view_cash_register_sessions',
    label: 'View cash register sessions',
    category: 'Sales & Cash Registers',
  },
  {
    key: 'manage_cash_movements',
    label: 'Record cash deposits/withdrawals',
    category: 'Sales & Cash Registers',
  },
  {
    key: 'manage_payment_methods',
    label: 'Manage payment methods',
    category: 'Sales & Cash Registers',
  },
  // Category: Products & Inventory
  {
    key: 'manage_products',
    label: 'Create, update, delete products',
    category: 'Products & Inventory',
  },
  {
    key: 'manage_categories',
    label: 'Manage product categories',
    category: 'Products & Inventory',
  },
  { key: 'view_inventory', label: 'View inventory', category: 'Products & Inventory' },
  {
    key: 'manage_inventory_movements',
    label: 'Record inventory movements',
    category: 'Products & Inventory',
  },
  {
    key: 'create_inventory_adjustment',
    label: 'Make stock adjustments',
    category: 'Products & Inventory',
  },
  {
    key: 'view_damaged_expired_reports',
    label: 'View damaged/expired product reports',
    category: 'Products & Inventory',
  },
  {
    key: 'create_damaged_expired_report',
    label: 'Create damaged/expired product report',
    category: 'Products & Inventory',
  },
  {
    key: 'approve_damaged_expired_report',
    label: 'Approve damaged/expired product reports',
    category: 'Products & Inventory',
  },
  // Category: Users & Roles
  { key: 'manage_users', label: 'Manage users (invite, suspend, etc.)', category: 'Users & Roles' },
  { key: 'manage_roles', label: 'Manage roles and permissions', category: 'Users & Roles' },
  { key: 'invite_users', label: 'Invite new users to the store', category: 'Users & Roles' },
  // Category: Suppliers & Orders
  { key: 'manage_suppliers', label: 'Manage suppliers', category: 'Suppliers & Orders' },
  { key: 'create_supplier_order', label: 'Create supplier orders', category: 'Suppliers & Orders' },
  { key: 'view_supplier_orders', label: 'View supplier orders', category: 'Suppliers & Orders' },
  {
    key: 'receive_supplier_order',
    label: 'Receive supplier orders',
    category: 'Suppliers & Orders',
  },
  // Category: Expenses
  { key: 'manage_expenses', label: 'Record and manage expenses', category: 'Expenses' },
  { key: 'view_expenses', label: 'View expenses', category: 'Expenses' },
  // Category: Store Settings
  { key: 'manage_store_settings', label: 'Manage store settings', category: 'Store Settings' },
  { key: 'customize_receipts', label: 'Customize sales receipts', category: 'Store Settings' },
];
export class SeedDefaultPermissions1753207596966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Utilisez queryRunner.manager pour interagir avec les entités dans la transaction de migration
    const hasTable = await queryRunner.hasTable('permissions');
    if (!hasTable) {
      console.log("Skipping permissions seed: table doesn't exist.");
      return;
    }
    const permissionRepository = queryRunner.manager.getRepository(Permission);
    for (const permData of defaultPermissions) {
      const existingPermission = await permissionRepository.findOne({
        where: { key: permData.key },
      });
      if (!existingPermission) {
        const newPermission = permissionRepository.create(permData);
        await permissionRepository.save(newPermission);
        console.log(`[Migration] Permission '${permData.key}' added.`);
      } else {
        // Optionnel: Mettre à jour le label si la permission existe déjà
        if (existingPermission.label !== permData.label) {
          existingPermission.label = permData.label;
          await permissionRepository.save(existingPermission);
          console.log(`[Migration] Permission '${permData.key}' updated.`);
        } else {
          console.log(`[Migration] Permission '${permData.key}' already exists, no update needed.`);
        }
      }
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // La logique 'down' pour les permissions de base est souvent vide ou un avertissement.
    // Supprimer des permissions essentielles peut casser l'application.
    // Si vous devez absolument annuler, assurez-vous de gérer les dépendances (ex: rôles liés).
    const permissionRepository = queryRunner.manager.getRepository(Permission);
    for (const permData of defaultPermissions) {
      await permissionRepository.delete({ key: permData.key });
      console.log(`[Migration] Permission '${permData.key}' removed.`);
    }
  }
}
