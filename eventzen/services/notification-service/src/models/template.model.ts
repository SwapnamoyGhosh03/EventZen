import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplateVersion {
  version: number;
  body: string;
  updated_by: string;
  updated_at: Date;
}

export interface ITemplate extends Document {
  template_key: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  versions: ITemplateVersion[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const templateVersionSchema = new Schema<ITemplateVersion>(
  {
    version: { type: Number, required: true },
    body: { type: String, required: true },
    updated_by: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    template_key: { type: String, required: true, unique: true },
    channel: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    variables: [{ type: String }],
    versions: [templateVersionSchema],
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'notification_templates' }
);

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
