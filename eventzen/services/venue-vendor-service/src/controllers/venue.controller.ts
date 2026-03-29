import { Request, Response, NextFunction } from 'express';
import { VenueService } from '../services/venue.service';
import { createVenueSchema, updateVenueSchema } from '../validators/venue.validators';
import { AppError } from '../middleware/errorHandler';

const venueService = new VenueService();

export class VenueController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createVenueSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid venue data', parsed.error.errors);
      }

      const venue = await venueService.createVenue(parsed.data, req.user!.userId);
      res.status(201).json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        city: req.query.city as string | undefined,
        minCapacity: req.query.minCapacity ? Number(req.query.minCapacity) : undefined,
        maxCapacity: req.query.maxCapacity ? Number(req.query.maxCapacity) : undefined,
        amenity: req.query.amenity as string | undefined,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        size: req.query.size ? Number(req.query.size) : 20,
      };

      const result = await venueService.listVenues(filters);
      res.json({ success: true, data: result.venues, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await venueService.getVenueById(req.params.id);
      res.json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateVenueSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid venue data', parsed.error.errors);
      }

      const venue = await venueService.updateVenue(req.params.id, parsed.data);
      res.json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await venueService.deactivateVenue(req.params.id);
      res.json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }
}
