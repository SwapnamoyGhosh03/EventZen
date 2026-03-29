import mongoose, { Schema, Document } from 'mongoose';

export interface IHall {
  hall_id: string;
  name: string;
  capacity: number;
  amenities: string[];
  hourly_rate: number;
  floor?: number;
}

export interface IVenue extends Document {
  name: string;
  description?: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  location?: {
    type: string;
    coordinates: [number, number];
  };
  total_capacity: number;
  halls: IHall[];
  amenities: string[];
  media_gallery: { url: string; caption?: string; type?: string }[];
  pricing: {
    base_rate?: number;
    currency?: string;
    pricing_model?: string;
  };
  contact: {
    name?: string;
    email?: string;
    phone?: string;
  };
  is_active: boolean;
  rating_average: number;
  rating_count: number;
  created_by?: string;
  createdAt: Date;
  updatedAt: Date;
}

const hallSchema = new Schema<IHall>(
  {
    hall_id: { type: String, required: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    amenities: [{ type: String }],
    hourly_rate: { type: Number, required: true },
    floor: { type: Number },
  },
  { _id: false }
);

const venueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    address: {
      street: { type: String },
      city: { type: String, required: true, index: true },
      state: { type: String },
      country: { type: String },
      zip: { type: String },
    },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    total_capacity: { type: Number, required: true },
    halls: [hallSchema],
    amenities: [{ type: String }],
    media_gallery: [
      {
        url: { type: String },
        caption: { type: String },
        type: { type: String },
      },
    ],
    pricing: {
      base_rate: { type: Number },
      currency: { type: String, default: 'INR' },
      pricing_model: { type: String },
    },
    contact: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    is_active: { type: Boolean, default: true },
    rating_average: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    created_by: { type: String },
  },
  { timestamps: true }
);

venueSchema.index({ 'location': '2dsphere' });

export const Venue = mongoose.model<IVenue>('Venue', venueSchema);
