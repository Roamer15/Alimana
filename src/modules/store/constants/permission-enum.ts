export enum PermissionKey {
  // Dashboard & Reports
  ACCESS_STORE_DASHBOARD = 'access_store_dashboard',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  VIEW_STOCK_REPORTS = 'view_stock_reports',
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // Sales & Cash Registers
  CREATE_SALE = 'create_sale',
  VIEW_SALES = 'view_sales',
  PROCESS_RETURNS = 'process_returns',
  MANAGE_CASH_REGISTERS = 'manage_cash_registers',
  OPEN_CASH_REGISTER_SESSION = 'open_cash_register_session',
  CLOSE_CASH_REGISTER_SESSION = 'close_cash_register_session',
  VIEW_CASH_REGISTER_SESSIONS = 'view_cash_register_sessions',
  MANAGE_CASH_MOVEMENTS = 'manage_cash_movements',

  MANAGE_PAYMENT_METHODS = 'manage_payment_methods',

  // Products & Inventory
  MANAGE_PRODUCTS = 'manage_products',
  MANAGE_CATEGORIES = 'manage_categories',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY_MOVEMENTS = 'manage_inventory_movements',
  CREATE_INVENTORY_ADJUSTMENT = 'create_inventory_adjustment',
  VIEW_DAMAGED_EXPIRED_REPORTS = 'view_damaged_expired_reports',
  CREATE_DAMAGED_EXPIRED_REPORT = 'create_damaged_expired_report',
  APPROVE_DAMAGED_EXPIRED_REPORT = 'approve_damaged_expired_report',

  // Users & Roles
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  INVITE_USERS = 'invite_users',

  // Suppliers & Orders
  MANAGE_SUPPLIERS = 'manage_suppliers',
  CREATE_SUPPLIER_ORDER = 'create_supplier_order',
  VIEW_SUPPLIER_ORDERS = 'view_supplier_orders',
  RECEIVE_SUPPLIER_ORDER = 'receive_supplier_order',

  // Expenses
  MANAGE_EXPENSES = 'manage_expenses',
  VIEW_EXPENSES = 'view_expenses',

  // Store Settings
  MANAGE_STORE_SETTINGS = 'manage_store_settings',
  CUSTOMIZE_RECEIPTS = 'customize_receipts',
}
