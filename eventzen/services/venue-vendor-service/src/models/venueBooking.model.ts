import mongoose, { Schema, Document } from 'mongoose';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IVenueBooking extends Document {
  booking_id: string;
  venue_id: mongoose.Types.ObjectId;
  hall_id?: string;
  event_id: string;
  organizer_id: string;
  booking_start: Date;
  booking_end: Date;
  status: BookingStatus;
  total_cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const venueBookingSchema = new Schema<IVenueBooking>(
  {
    booking_id: { type: String, required: true, unique: true },
    venue_id: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    hall_id: { type: String },
    event_id: { type: String, required: true, index: true },
    organizer_id: { type: String, required: true },
    booking_start: { type: Date, required: true },
    booking_end: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    total_cost: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

venueBookingSchema.index(
  { venue_id: 1, hall_id: 1, booking_start: 1, booking_end: 1 }
);

export const VenueBooking = mongoose.model<IVenueBooking>('VenueBooking', venueBookingSchema);
