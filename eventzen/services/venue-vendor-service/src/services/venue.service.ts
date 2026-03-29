import { Venue, IVenue } from '../models/venue.model';
import { AppError } from '../middleware/errorHandler';
import { cacheGet, cacheSet, cacheDel } from '../cache/redis';

interface VenueFilters {
  city?: string;
  minCapacity?: number;
  maxCapacity?: number;
  amenity?: string;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export class VenueService {
  async createVenue(data: Partial<IVenue>, userId: string): Promise<IVenue> {
    const venue = new Venue({ ...data, created_by: userId });
    return venue.save();
  }

  async listVenues(filters: VenueFilters) {
    const page = filters.page || 1;
    const size = filters.size || 20;
    const skip = (page - 1) * size;

    const query: Record<string, unknown> = {};

    if (filters.city) query['address.city'] = { $regex: filters.city, $options: 'i' };
    if (filters.minCapacity) query.total_capacity = { ...((query.total_capacity as object) || {}), $gte: filters.minCapacity };
    if (filters.maxCapacity) query.total_capacity = { ...((query.total_capacity as object) || {}), $lte: filters.maxCapacity };
    if (filters.amenity) query.amenities = filters.amenity;
    if (filters.is_active !== undefined) query.is_active = filters.is_active;
    else query.is_active = true;

    const [venues, total] = await Promise.all([
      Venue.find(query).skip(skip).limit(size).sort({ createdAt: -1 }),
      Venue.countDocuments(query),
    ]);

    return {
      venues,
      meta: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }

  async getVenueById(id: string): Promise<IVenue> {
    const cacheKey = `venue:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      throw new AppError(404, 'EVT-1001', 'Venue not found');
    }

    await cacheSet(cacheKey, JSON.stringify(venue), 300);
    return venue;
  }

  async updateVenue(id: string, data: Partial<IVenue>): Promise<IVenue> {
    const venue = await Venue.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!venue) {
      throw new AppError(404, 'EVT-1001', 'Venue not found');
    }
    await cacheDel(`venue:${id}`);
    return venue;
  }

  async deactivateVenue(id: string): Promise<IVenue> {
    const venue = await Venue.findByIdAndUpdate(id, { $set: { is_active: false } }, { new: true });
    if (!venue) {
      throw new AppError(404, 'EVT-1001', 'Venue not found');
    }
    await cacheDel(`venue:${id}`);
    return venue;
  }
}
