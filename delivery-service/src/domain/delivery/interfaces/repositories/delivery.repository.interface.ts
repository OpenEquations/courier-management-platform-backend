import { Delivery } from '../../entities/delivery.entity';

export interface IDeliveryRepository {
  save(delivery: Delivery): Promise<void>;
  findById(id: string): Promise<Delivery | null>;
  findByTrackingNumber(trackingNumber: string): Promise<Delivery | null>;
  findBySenderId(senderId: string): Promise<Delivery[]>;
  findByCourierId(courierId: string): Promise<Delivery[]>;
}
