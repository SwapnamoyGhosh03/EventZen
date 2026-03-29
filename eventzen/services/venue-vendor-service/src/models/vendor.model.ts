import mongoose, { Schema, Document } from 'mongoose';

export enum ServiceType {
  CATERING = 'CATERING',
  AV = 'AV',
  DECOR = 'DECOR',
  SECURITY = 'SECURITY',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  LOGISTICS = 'LOGISTICS',
  OTHER = 'OTHER',
}

export interface IReview {
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface IServicePackage {
  package_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
}

export interface IVendor extends Document {
  vendor_id: string;
  name: string;
  description?: string;
  service_type: ServiceType;
  service_packages: IServicePackage[];
  contact: {
    name?: string;
    email?: string;
    phone?: string;
  };
  portfolio_urls: string[];
  rating_average: number;
  rating_count: number;
  reviews: IReview[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewer_id: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const servicePackageSchema = new Schema<IServicePackage>(
  {
    package_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

const vendorSchema = new Schema<IVendor>(
  {
    vendor_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    service_type: {
      type: String,
      enum: Object.values(ServiceType),
      required: true,
      index: true,
    },
    service_packages: [servicePackageSchema],
    contact: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    portfolio_urls: [{ type: String }],
    rating_average: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    reviews: [reviewSchema],
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
