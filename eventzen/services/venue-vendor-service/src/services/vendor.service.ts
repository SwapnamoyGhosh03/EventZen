import { v4 as uuidv4 } from 'uuid';
import { Vendor, IVendor } from '../models/vendor.model';
import { AppError } from '../middleware/errorHandler';

interface VendorFilters {
  service_type?: string;
  is_active?: boolean;
  name?: string;
  page?: number;
  size?: number;
}

export class VendorService {
  async createVendor(data: Partial<IVendor>): Promise<IVendor> {
    const vendor = new Vendor({
      ...data,
      vendor_id: uuidv4(),
    });
    return vendor.save();
  }

  async listVendors(filters: VendorFilters) {
    const page = filters.page || 1;
    const size = filters.size || 20;
    const skip = (page - 1) * size;

    const query: Record<string, unknown> = {};
    if (filters.service_type) query.service_type = filters.service_type;
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.is_active !== undefined) query.is_active = filters.is_active;
    else query.is_active = true;

    const [vendors, total] = await Promise.all([
      Vendor.find(query).skip(skip).limit(size).sort({ rating_average: -1 }),
      Vendor.countDocuments(query),
    ]);

    return {
      vendors,
      meta: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }

  async getVendorById(vendorId: string): Promise<IVendor> {
    const vendor = await Vendor.findOne({ vendor_id: vendorId });
    if (!vendor) {
      throw new AppError(404, 'EVT-3001', 'Vendor not found');
    }
    return vendor;
  }

  async submitReview(
    vendorId: string,
    reviewerId: string,
    rating: number,
    comment?: string
  ): Promise<IVendor> {
    const vendor = await Vendor.findOne({ vendor_id: vendorId });
    if (!vendor) {
      throw new AppError(404, 'EVT-3001', 'Vendor not found');
    }

    vendor.reviews.push({
      reviewer_id: reviewerId,
      rating,
      comment,
      created_at: new Date(),
    });

    vendor.rating_count = vendor.reviews.length;
    vendor.rating_average =
      Math.round(
        (vendor.reviews.reduce((sum, r) => sum + r.rating, 0) / vendor.rating_count) * 10
      ) / 10;

    return vendor.save();
  }
}
