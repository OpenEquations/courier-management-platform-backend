export interface IEventPublisherPort {
  publish(event: object): Promise<void>;
}
