import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1752116061282 implements MigrationInterface {
  name = 'InitSchema1752116061282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_refresh_tokens" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "token_hash" character varying(255) NOT NULL, "user_agent" character varying, "ip_address" character varying, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "revoked" boolean NOT NULL DEFAULT false, "store_user_id" integer, CONSTRAINT "PK_c5f5cf35bd8aabd1ebe9bb13409" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_auth_provider_enum" AS ENUM('local', 'google', 'facebook')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying, "full_name" character varying(100) NOT NULL, "phone" character varying, "avatar_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "auth_provider" "public"."users_auth_provider_enum" NOT NULL DEFAULT 'local', "last_selected_store_user_id" integer, "provider_id" character varying, "can_create_store" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_20c7aea6112bef71528210f631" ON "users" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_871219598c7fe7f84b0e2e9102" ON "users" ("last_selected_store_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42c1373d33101a10148dc559fa" ON "users" ("can_create_store") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "token" character varying NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "accepted_at" TIMESTAMP, "store_id" integer NOT NULL, "role_id" integer NOT NULL, "invited_by_id" integer NOT NULL, CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97ab59cb592c7cec109741b592" ON "invitations" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "label" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_017943867ed5ceef9c03edd9745" UNIQUE ("key"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "is_default" boolean NOT NULL DEFAULT false, "store_id" integer NOT NULL, "created_by_user_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "storeId" integer, "createdByUserId" integer, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_type_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "store_id" integer, "store_user_id" integer NOT NULL, "action_type" "public"."audit_logs_action_type_enum" NOT NULL, "entity" character varying NOT NULL, "entity_id" integer NOT NULL, "old_value" json, "new_value" json, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "ip_address" character varying(45), "user_agent" character varying(255), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d36a1378af2ad3603e47352372" ON "audit_logs" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0180a787e8b2c27d6e9e0fe723" ON "audit_logs" ("store_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_445557993007fefee3aa9f1117" ON "audit_logs" ("entity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85c204d8e47769ac183b32bf9c" ON "audit_logs" ("entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98472fa33e94a9f41f3ee6d88b" ON "audit_logs" ("action_type", "entity", "entity_id", "store_id", "store_user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "store_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23c05c292c439d77b0de816b50" ON "category" ("name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('IN', 'OUT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_movements_movement_type_enum" AS ENUM('SALE', 'PURCHASE', 'RETURN', 'DAMAGE', 'ADJUSTMENT', 'TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_movements_source_type_enum" AS ENUM('SALE', 'PURCHASE_ORDER', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'DAMAGE_REPORT', 'MANUAL_ADJUSTMENT', 'TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movements" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "type" "public"."inventory_movements_type_enum" NOT NULL, "movement_type" "public"."inventory_movements_movement_type_enum" NOT NULL, "source_id" integer, "source_type" "public"."inventory_movements_source_type_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" integer, "notes" text, CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_522ed6d9a2b07f06bff2514720" ON "inventory_movements" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c3bec1682252c36fa16158773" ON "inventory_movements" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movement_items" ("id" SERIAL NOT NULL, "inventory_movement_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit_cost" numeric(10,2), CONSTRAINT "PK_7661d7a21b2a26e49f1c2736c0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."supplier_orders_status_enum" AS ENUM('draft', 'ordered', 'received', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "supplier_orders" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "supplier_id" integer, "ordered_by_id" integer, "status" "public"."supplier_orders_status_enum" NOT NULL DEFAULT 'draft', "ordered_at" TIMESTAMP NOT NULL, "received_at" TIMESTAMP, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_173a35a11da553f03ee6f439021" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01b933edb45a771157c4624294" ON "supplier_orders" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07c857f9e55d2dbe7273f9adcc" ON "supplier_orders" ("ordered_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "supplier_order_items" ("id" SERIAL NOT NULL, "supplier_order_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit_cost" numeric(10,2) NOT NULL, "total_cost" numeric(12,2) NOT NULL, "received_quantity" numeric(10,2), CONSTRAINT "PK_fbf9cc8e71ef8305264e83b9cfb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_465a8241ae4dc9aadebfa8b31a" ON "supplier_order_items" ("supplier_order_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."damaged_or_expired_reports_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "damaged_or_expired_reports" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "reported_by_id" integer, "approved_by_id" integer, "reason" text NOT NULL, "notes" text, "status" "public"."damaged_or_expired_reports_status_enum" NOT NULL DEFAULT 'pending', "approved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b02dda9843c36416539a751a98a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6239af9ac7aa466db877d875fb" ON "damaged_or_expired_reports" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6612a954527d6d8bd6b513ab3e" ON "damaged_or_expired_reports" ("reported_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "damaged_or_expired_items" ("id" SERIAL NOT NULL, "report_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "notes" text, CONSTRAINT "PK_31ba0f4212c561139a1038bfe10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc1760c403ff4285aec4eafbe" ON "damaged_or_expired_items" ("report_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff3a295aaef4e25ae4b67609aa" ON "damaged_or_expired_items" ("report_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_returns_status_enum" AS ENUM('pending', 'processed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_returns" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "sale_id" integer NOT NULL, "processed_by_id" integer, "total_refund" numeric(10,2) NOT NULL, "reason" text NOT NULL, "status" "public"."customer_returns_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6901ab4ff204cb64b86380e917" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_630e6f054a72ca48f97fbc8960" ON "customer_returns" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c9e419e7c5a6a3e37cfb9deafe" ON "customer_returns" ("sale_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f4fd3595644cddb96cf0da314" ON "customer_returns" ("processed_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_return_items" ("id" SERIAL NOT NULL, "customer_return_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "refund_amount" numeric(10,2) NOT NULL, "reason" text, CONSTRAINT "PK_57ee844ca74cca9632d47a18992" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d281efbec8ee5caac570365973" ON "customer_return_items" ("customer_return_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2007392ae2d71f17b8af09dfd8" ON "customer_return_items" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e294f2bd492e6a7dfbaf6623c" ON "customer_return_items" ("customer_return_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "barcode" character varying, "sku" character varying, "brand" character varying, "unit" character varying, "selling_price" numeric(10,2) NOT NULL, "cost_price" numeric(10,2) NOT NULL DEFAULT '0', "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "quantity_in_stock" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "image_url" character varying, "category_id" integer, "created_by_id" integer, "store_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a5f6868c96e0069e699f33e12" ON "products" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_68863607048a1abd43772b314e" ON "products" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f2ff0d6409027115aea231bc22" ON "products" ("store_id", "barcode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_items" ("id" SERIAL NOT NULL, "sale_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL, "product_name" character varying(255) NOT NULL, "original_price" numeric(10,2), "unit_price" numeric(10,2) NOT NULL, "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "total_price" numeric(10,2) NOT NULL, "saleId" integer, "productId" integer, CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c210a330b80232c29c2ad68462" ON "sale_items" ("sale_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ecae62db3f9e9cc9a368d57ad" ON "sale_items" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sale-receipts" ("id" SERIAL NOT NULL, "sale_id" integer NOT NULL, "content" text, "receipt_number" character varying(100), "generated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "saleId" integer, CONSTRAINT "REL_0fd5f9a1cb1f59925efda72618" UNIQUE ("saleId"), CONSTRAINT "PK_c2a03a5a48abfb204e909901263" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_methods" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "display_name" character varying, "is_default" boolean NOT NULL DEFAULT false, "store_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a793d7354d7c3aaf76347ee5a6" ON "payment_methods" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75bd6d443e647f6de95776a786" ON "payment_methods" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a74e4d890b7799d91b68bcea16" ON "payment_methods" ("store_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "sale_id" integer NOT NULL, "payment_method_id" integer NOT NULL, "amount" numeric(10,2) NOT NULL, "transaction_reference" character varying(100), "status" "public"."payments_status_enum" NOT NULL DEFAULT 'completed', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "saleId" integer, "paymentMethodId" integer, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a9272c4415ef64294b104e378a" ON "payments" ("sale_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12fd861c33c885f01b9a7da7d9" ON "payments" ("payment_method_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sales" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "created_by_id" integer NOT NULL, "cash_register_session_id" integer, "total_amount" numeric(10,2) NOT NULL, "discount" numeric(10,2) NOT NULL DEFAULT '0', "is_refunded" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c1fae113ae666969a94d79d63" ON "sales" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cash_registers" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "name" character varying(100) NOT NULL, "description" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1cc711056395d079d8f041ce34" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0884e1723faa3908dc2c1c9edd" ON "cash_registers" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2ec1a4a6223eb652068fe50a8f" ON "cash_registers" ("name", "store_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_register_sessions_status_enum" AS ENUM('open', 'closed', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cash_register_sessions" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "store_user_id" integer NOT NULL, "opened_at" TIMESTAMP NOT NULL, "closed_at" TIMESTAMP, "initial_cash" numeric(12,2) NOT NULL, "closing_cash" numeric(12,2), "system_cash_total" numeric(12,2), "status" "public"."cash_register_sessions_status_enum" NOT NULL DEFAULT 'open', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cash_register_id" integer, CONSTRAINT "PK_a852ffb1595560317cd41a2dcf5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_95b82a09a07271212c8bd99a25" ON "cash_register_sessions" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9372c6cfd99a37602a2b9214d5" ON "cash_register_sessions" ("store_user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."store_users_status_enum" AS ENUM('pending', 'active', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_users" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "store_id" integer NOT NULL, "role_id" integer, "status" "public"."store_users_status_enum" NOT NULL DEFAULT 'pending', "joined_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "storeId" integer, "roleId" integer, CONSTRAINT "PK_6af90d774177332a7a99a7c1c9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42238d178964a4b4e9ceb8c3b1" ON "store_users" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33788f3b8b1f941eee2a81915e" ON "store_users" ("storeId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."store_settings_type_enum" AS ENUM('string', 'number', 'boolean', 'json')`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_settings" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "key" character varying(100) NOT NULL, "value" text NOT NULL, "type" "public"."store_settings_type_enum" NOT NULL, "description" text, "is_editable" boolean NOT NULL DEFAULT true, "is_system" boolean NOT NULL DEFAULT false, "profile_image_url" character varying(255), "logo_url" character varying(255), "created_by_id" integer, "updated_by_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4da44f346b360f378f1489b6199" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93ddadc260096333b6a95aff7c" ON "store_settings" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd84ae02bcbbeb0dcabf3f4351" ON "store_settings" ("key") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_08760e2e1af00efe7c577f22c8" ON "store_settings" ("store_id", "key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "stores" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "address" character varying(255), "phone" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a205ca5a37fa5e10005f003aaf" ON "stores" ("name") `);
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(150), "phone" character varying(30), "address" text, "created_by_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b65a15acf2e34137794564e1b" ON "suppliers" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07837b276a6cef18a41c33b5ff" ON "suppliers" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_92fddc426abb85c65ee174da94" ON "suppliers" ("store_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "description" character varying(255) NOT NULL, "category" character varying(100) NOT NULL, "date" date NOT NULL, "created_by" integer, "reference" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60dc343125132e11cb89abbd5a" ON "expenses" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c0c012c2f8e6578277c239ee6" ON "expenses" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("roleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON "role_permissions" ("roleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON "role_permissions" ("permissionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "FK_15ffbf3cf712c581611caf2130a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "FK_61b3a6bb79f23a5e11250811c75" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_6038fbbccb21e5f1228a97fd82b" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_d4de0403dd012cf87b430af70ef" FOREIGN KEY ("invited_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_6869561b4803c2d95076d83cfbc" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_b935d19ac231701703cb345a140" FOREIGN KEY ("createdByUserId") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_d36a1378af2ad3603e47352372d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_9d0921940cddedc4eb5db92871d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_522ed6d9a2b07f06bff2514720c" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_5c3bec1682252c36fa161587738" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1716ca36c57e02426645d761ff6" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement_items" ADD CONSTRAINT "FK_3839ee53bf28aa99a724b818e28" FOREIGN KEY ("inventory_movement_id") REFERENCES "inventory_movements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement_items" ADD CONSTRAINT "FK_185e7bb98ef0e82437163ae2dbd" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" ADD CONSTRAINT "FK_01b933edb45a771157c4624294e" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" ADD CONSTRAINT "FK_79caba00e2b27171799466e420b" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" ADD CONSTRAINT "FK_07c857f9e55d2dbe7273f9adccb" FOREIGN KEY ("ordered_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_order_items" ADD CONSTRAINT "FK_d298c1025e5f1d44454d4890c85" FOREIGN KEY ("supplier_order_id") REFERENCES "supplier_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_order_items" ADD CONSTRAINT "FK_7a2ff1ebd607dee8142b8344c1c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" ADD CONSTRAINT "FK_6239af9ac7aa466db877d875fbb" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" ADD CONSTRAINT "FK_6612a954527d6d8bd6b513ab3e6" FOREIGN KEY ("reported_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" ADD CONSTRAINT "FK_114e3f5fec57fabc545b7820c2b" FOREIGN KEY ("approved_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_items" ADD CONSTRAINT "FK_ccc1760c403ff4285aec4eafbe6" FOREIGN KEY ("report_id") REFERENCES "damaged_or_expired_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_items" ADD CONSTRAINT "FK_97d8903dd14f575196b81c3aeb7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" ADD CONSTRAINT "FK_630e6f054a72ca48f97fbc8960d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" ADD CONSTRAINT "FK_c9e419e7c5a6a3e37cfb9deafe2" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" ADD CONSTRAINT "FK_9f4fd3595644cddb96cf0da314c" FOREIGN KEY ("processed_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_return_items" ADD CONSTRAINT "FK_d281efbec8ee5caac5703659735" FOREIGN KEY ("customer_return_id") REFERENCES "customer_returns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_return_items" ADD CONSTRAINT "FK_2007392ae2d71f17b8af09dfd85" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_6dc43b3c8cbde659f3cf9765198" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_68863607048a1abd43772b314ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c642be08de5235317d4cf3deb40" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_d675aea38a16313e844662c48f8" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_75bd6d443e647f6de95776a786c" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e15427928c7a02bd304d628c41e" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_6c1fae113ae666969a94d79d637" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_579a13a0f8d438c6f5a0d732556" FOREIGN KEY ("createdById") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_76f6480dfae76102eb6ffeed24b" FOREIGN KEY ("cash_register_session_id") REFERENCES "cash_register_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_registers" ADD CONSTRAINT "FK_0884e1723faa3908dc2c1c9edd7" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_95b82a09a07271212c8bd99a25c" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_5a1aa23955689611e290bfa1a35" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_42238d178964a4b4e9ceb8c3b12" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_33788f3b8b1f941eee2a81915e3" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_333dbe1ccd63089660ffbb1c35f" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD CONSTRAINT "FK_93ddadc260096333b6a95aff7c1" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD CONSTRAINT "FK_dbf92e9300472fb215520c0d9da" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD CONSTRAINT "FK_27240f51ee71e9550130050ea71" FOREIGN KEY ("updated_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_7b65a15acf2e34137794564e1b0" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_07837b276a6cef18a41c33b5ffb" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_60dc343125132e11cb89abbd5aa" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_7c0c012c2f8e6578277c239ee61" FOREIGN KEY ("created_by") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_7c0c012c2f8e6578277c239ee61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_60dc343125132e11cb89abbd5aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_07837b276a6cef18a41c33b5ffb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_7b65a15acf2e34137794564e1b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP CONSTRAINT "FK_27240f51ee71e9550130050ea71"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP CONSTRAINT "FK_dbf92e9300472fb215520c0d9da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP CONSTRAINT "FK_93ddadc260096333b6a95aff7c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_333dbe1ccd63089660ffbb1c35f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_33788f3b8b1f941eee2a81915e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_42238d178964a4b4e9ceb8c3b12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_5a1aa23955689611e290bfa1a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_95b82a09a07271212c8bd99a25c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_registers" DROP CONSTRAINT "FK_0884e1723faa3908dc2c1c9edd7"`,
    );
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_76f6480dfae76102eb6ffeed24b"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_579a13a0f8d438c6f5a0d732556"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_6c1fae113ae666969a94d79d637"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e15427928c7a02bd304d628c41e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_75bd6d443e647f6de95776a786c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_d675aea38a16313e844662c48f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c642be08de5235317d4cf3deb40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_68863607048a1abd43772b314ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_6dc43b3c8cbde659f3cf9765198"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_return_items" DROP CONSTRAINT "FK_2007392ae2d71f17b8af09dfd85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_return_items" DROP CONSTRAINT "FK_d281efbec8ee5caac5703659735"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" DROP CONSTRAINT "FK_9f4fd3595644cddb96cf0da314c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" DROP CONSTRAINT "FK_c9e419e7c5a6a3e37cfb9deafe2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_returns" DROP CONSTRAINT "FK_630e6f054a72ca48f97fbc8960d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_items" DROP CONSTRAINT "FK_97d8903dd14f575196b81c3aeb7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_items" DROP CONSTRAINT "FK_ccc1760c403ff4285aec4eafbe6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" DROP CONSTRAINT "FK_114e3f5fec57fabc545b7820c2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" DROP CONSTRAINT "FK_6612a954527d6d8bd6b513ab3e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "damaged_or_expired_reports" DROP CONSTRAINT "FK_6239af9ac7aa466db877d875fbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_order_items" DROP CONSTRAINT "FK_7a2ff1ebd607dee8142b8344c1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_order_items" DROP CONSTRAINT "FK_d298c1025e5f1d44454d4890c85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" DROP CONSTRAINT "FK_07c857f9e55d2dbe7273f9adccb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" DROP CONSTRAINT "FK_79caba00e2b27171799466e420b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_orders" DROP CONSTRAINT "FK_01b933edb45a771157c4624294e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement_items" DROP CONSTRAINT "FK_185e7bb98ef0e82437163ae2dbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement_items" DROP CONSTRAINT "FK_3839ee53bf28aa99a724b818e28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1716ca36c57e02426645d761ff6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_5c3bec1682252c36fa161587738"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_522ed6d9a2b07f06bff2514720c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_9d0921940cddedc4eb5db92871d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_d36a1378af2ad3603e47352372d"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_b935d19ac231701703cb345a140"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_6869561b4803c2d95076d83cfbc"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_d4de0403dd012cf87b430af70ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_6038fbbccb21e5f1228a97fd82b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "FK_61b3a6bb79f23a5e11250811c75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "FK_15ffbf3cf712c581611caf2130a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_06792d0c62ce6b0203c03643cd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b4599f8b8f548d35850afa2d12"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7c0c012c2f8e6578277c239ee6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60dc343125132e11cb89abbd5a"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_92fddc426abb85c65ee174da94"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_07837b276a6cef18a41c33b5ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b65a15acf2e34137794564e1b"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a205ca5a37fa5e10005f003aaf"`);
    await queryRunner.query(`DROP TABLE "stores"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_08760e2e1af00efe7c577f22c8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd84ae02bcbbeb0dcabf3f4351"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_93ddadc260096333b6a95aff7c"`);
    await queryRunner.query(`DROP TABLE "store_settings"`);
    await queryRunner.query(`DROP TYPE "public"."store_settings_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33788f3b8b1f941eee2a81915e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_42238d178964a4b4e9ceb8c3b1"`);
    await queryRunner.query(`DROP TABLE "store_users"`);
    await queryRunner.query(`DROP TYPE "public"."store_users_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9372c6cfd99a37602a2b9214d5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_95b82a09a07271212c8bd99a25"`);
    await queryRunner.query(`DROP TABLE "cash_register_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."cash_register_sessions_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2ec1a4a6223eb652068fe50a8f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0884e1723faa3908dc2c1c9edd"`);
    await queryRunner.query(`DROP TABLE "cash_registers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6c1fae113ae666969a94d79d63"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_12fd861c33c885f01b9a7da7d9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a9272c4415ef64294b104e378a"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a74e4d890b7799d91b68bcea16"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_75bd6d443e647f6de95776a786"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a793d7354d7c3aaf76347ee5a6"`);
    await queryRunner.query(`DROP TABLE "payment_methods"`);
    await queryRunner.query(`DROP TABLE "sale-receipts"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4ecae62db3f9e9cc9a368d57ad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c210a330b80232c29c2ad68462"`);
    await queryRunner.query(`DROP TABLE "sale_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f2ff0d6409027115aea231bc22"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_68863607048a1abd43772b314e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a5f6868c96e0069e699f33e12"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2e294f2bd492e6a7dfbaf6623c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2007392ae2d71f17b8af09dfd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d281efbec8ee5caac570365973"`);
    await queryRunner.query(`DROP TABLE "customer_return_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9f4fd3595644cddb96cf0da314"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c9e419e7c5a6a3e37cfb9deafe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_630e6f054a72ca48f97fbc8960"`);
    await queryRunner.query(`DROP TABLE "customer_returns"`);
    await queryRunner.query(`DROP TYPE "public"."customer_returns_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ff3a295aaef4e25ae4b67609aa"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ccc1760c403ff4285aec4eafbe"`);
    await queryRunner.query(`DROP TABLE "damaged_or_expired_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6612a954527d6d8bd6b513ab3e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6239af9ac7aa466db877d875fb"`);
    await queryRunner.query(`DROP TABLE "damaged_or_expired_reports"`);
    await queryRunner.query(`DROP TYPE "public"."damaged_or_expired_reports_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_465a8241ae4dc9aadebfa8b31a"`);
    await queryRunner.query(`DROP TABLE "supplier_order_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_07c857f9e55d2dbe7273f9adcc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01b933edb45a771157c4624294"`);
    await queryRunner.query(`DROP TABLE "supplier_orders"`);
    await queryRunner.query(`DROP TYPE "public"."supplier_orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "inventory_movement_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c3bec1682252c36fa16158773"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_522ed6d9a2b07f06bff2514720"`);
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_movements_source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_movements_movement_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_movements_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23c05c292c439d77b0de816b50"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_98472fa33e94a9f41f3ee6d88b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_85c204d8e47769ac183b32bf9c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_445557993007fefee3aa9f1117"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0180a787e8b2c27d6e9e0fe723"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d36a1378af2ad3603e47352372"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_type_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97ab59cb592c7cec109741b592"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_42c1373d33101a10148dc559fa"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_871219598c7fe7f84b0e2e9102"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20c7aea6112bef71528210f631"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_auth_provider_enum"`);
    await queryRunner.query(`DROP TABLE "user_refresh_tokens"`);
  }
}
