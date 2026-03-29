import mongoose, { Schema, Document } from 'mongoose';

export enum TokenPlatform {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export interface IPushToken extends Document {
  user_id: string;
  token: string;
  platform: TokenPlatform;
  created_at: Date;
  last_used_at: Date;
}

const pushTokenSchema = new Schema<IPushToken>(
  {
    user_id: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: {
      type: String,
      enum: Object.values(TokenPlatform),
      required: true,
    },
    created_at: { type: Date, default: Date.now },
    last_used_at: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'push_tokens' }
);

export const PushToken = mongoose.model<IPushToken>('PushToken', pushTokenSchema);
