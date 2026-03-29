import mongoose, { Schema, Document } from 'mongoose';

export interface IChannelPreference {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface IPreference extends Document {
  user_id: string;
  preferences: Map<string, IChannelPreference>;
  updated_at: Date;
}

const channelPreferenceSchema = new Schema<IChannelPreference>(
  {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },
  { _id: false }
);

const preferenceSchema = new Schema<IPreference>(
  {
    user_id: { type: String, required: true, unique: true },
    preferences: {
      type: Map,
      of: channelPreferenceSchema,
      default: new Map(),
    },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'notification_preferences' }
);

export const Preference = mongoose.model<IPreference>('Preference', preferenceSchema);
