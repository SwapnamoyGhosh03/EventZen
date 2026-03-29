import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';
import { createVendorSchema, submitReviewSchema } from '../validators/vendor.validators';
import { AppError } from '../middleware/errorHandler';

const vendorService = new VendorService();

export class VendorController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        service_type: req.query.service_type as string | undefined,
        name: req.query.name as string | undefined,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        size: req.query.size ? Number(req.query.size) : 20,
      };

      const result = await vendorService.listVendors(filters);
      res.json({ success: true, data: result.vendors, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor data', parsed.error.errors);
      }

      const vendor = await vendorService.createVendor(parsed.data as any);
      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  }

  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = submitReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid review data', parsed.error.errors);
      }

      const vendor = await vendorService.submitReview(
        req.params.id,
        req.user!.userId,
        parsed.data.rating,
        parsed.data.comment
      );

      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  }
}
