import { PaginatedResult } from 'src/domain/shared/interfaces/paginated-result.interface';
import { TripResponseDto } from './trip-response.dto';

export type TripListResponseDto = PaginatedResult<TripResponseDto>;
