import Handlebars from 'handlebars';
import { Template, ITemplate } from '../models/template.model';
import { AppError } from '../middleware/errorHandler';

export async function getAllTemplates(): Promise<ITemplate[]> {
  return Template.find().sort({ createdAt: -1 });
}

export async function getTemplateByKey(templateKey: string): Promise<ITemplate | null> {
  return Template.findOne({ template_key: templateKey, is_active: true });
}

export async function createTemplate(data: {
  template_key: string;
  channel: string;
  subject?: string;
  body: string;
  variables?: string[];
  created_by: string;
}): Promise<ITemplate> {
  const existing = await Template.findOne({ template_key: data.template_key });
  if (existing) {
    throw new AppError(409, 'NOTIF-2001', `Template with key '${data.template_key}' already exists`);
  }

  return Template.create({
    template_key: data.template_key,
    channel: data.channel,
    subject: data.subject || '',
    body: data.body,
    variables: data.variables || [],
    versions: [{ version: 1, body: data.body, updated_by: data.created_by, updated_at: new Date() }],
  });
}

export async function updateTemplate(
  id: string,
  data: { subject?: string; body?: string; variables?: string[]; is_active?: boolean; updated_by: string }
): Promise<ITemplate> {
  const template = await Template.findById(id);
  if (!template) {
    throw new AppError(404, 'NOTIF-2002', 'Template not found');
  }

  if (data.subject !== undefined) template.subject = data.subject;
  if (data.variables !== undefined) template.variables = data.variables;
  if (data.is_active !== undefined) template.is_active = data.is_active;

  if (data.body !== undefined && data.body !== template.body) {
    const nextVersion = template.versions.length + 1;
    template.versions.push({
      version: nextVersion,
      body: data.body,
      updated_by: data.updated_by,
      updated_at: new Date(),
    });
    template.body = data.body;
  }

  return template.save();
}

export function renderTemplate(templateBody: string, variables: Record<string, unknown>): string {
  const compiled = Handlebars.compile(templateBody);
  return compiled(variables);
}

export async function previewTemplate(
  id: string,
  sampleData: Record<string, unknown>
): Promise<{ subject: string; body: string }> {
  const template = await Template.findById(id);
  if (!template) {
    throw new AppError(404, 'NOTIF-2002', 'Template not found');
  }

  return {
    subject: template.subject ? renderTemplate(template.subject, sampleData) : '',
    body: renderTemplate(template.body, sampleData),
  };
}
