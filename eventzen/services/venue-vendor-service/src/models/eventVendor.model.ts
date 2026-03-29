import mongoose, { Schema, Document } from 'mongoose';

export enum ContractStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IVersionHistory {
  version: number;
  status: ContractStatus;
  changed_by: string;
  changed_at: Date;
  notes?: string;
}

export interface IEventVendor extends Document {
  contract_id: string;
  event_id: string;
  vendor_id: string;
  service_description?: string;
  agreed_price: number;
  currency: string;
  status: ContractStatus;
  signed_at?: Date;
  version_history: IVersionHistory[];
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

const versionHistorySchema = new Schema<IVersionHistory>(
  {
    version: { type: Number, required: true },
    status: { type: String, enum: Object.values(ContractStatus), required: true },
    changed_by: { type: String, required: true },
    changed_at: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const eventVendorSchema = new Schema<IEventVendor>(
  {
    contract_id: { type: String, required: true, unique: true },
    event_id: { type: String, required: true, index: true },
    vendor_id: { type: String, required: true, index: true },
    service_description: { type: String },
    agreed_price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.PENDING,
    },
    signed_at: { type: Date },
    version_history: [versionHistorySchema],
    created_by: { type: String, required: true },
  },
  { timestamps: true }
);

export const EventVendor = mongoose.model<IEventVendor>('EventVendor', eventVendorSchema);
