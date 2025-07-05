import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { Product } from './product.entity';

@Entity('inventory_movement_items')
export class InventoryMovementItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InventoryMovement, (movement) => movement.items, { nullable: false })
  @JoinColumn({ name: 'inventory_movement_id' })
  inventoryMovement: InventoryMovement;

  @Column()
  inventoryMovementId: number;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  productId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unit_cost: number | null;
}
