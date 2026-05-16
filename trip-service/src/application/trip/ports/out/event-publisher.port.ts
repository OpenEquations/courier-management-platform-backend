export interface IEventPublisherPort {
  publish<T extends object>(event: T): Promise<void>;
}
