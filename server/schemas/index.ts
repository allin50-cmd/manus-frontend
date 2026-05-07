import { z } from 'zod';

export const LeadSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  product: z.enum(['vaultline', 'ultai', 'fineguard', 'law-clerks']).optional(),
  company: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
});

export const IntakeSchema = z.object({
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  matterType: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().optional(),
  claimValue: z.string().optional(),
});

export const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  subject: z.string().optional(),
});

export const AuditSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  chamberSize: z.string().optional(),
  painPoints: z.union([z.array(z.string()), z.string()]).optional(),
});

export const BarristerSchema = z.object({
  fullName: z.string().min(1).max(255),
  yearOfCall: z.number().int().min(1900).max(2100).optional(),
  specialisms: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'door-tenant']).default('active'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const BriefSchema = z.object({
  title: z.string().min(1).max(500),
  clientName: z.string().min(1).max(255),
  matterType: z.string().min(1),
  status: z.enum(['received', 'accepted', 'rejected', 'completed']).default('received'),
  barristerId: z.string().uuid().optional(),
  hearingDate: z.string().optional(),
  feeAgreed: z.string().optional(),
  court: z.string().optional(),
  notes: z.string().optional(),
});

export const NoteSchema = z.object({
  note: z.string().min(1),
  briefId: z.string().uuid().optional(),
  barristerId: z.string().uuid().optional(),
  createdBy: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
export type IntakeInput = z.infer<typeof IntakeSchema>;
export type ContactInput = z.infer<typeof ContactSchema>;
export type AuditSignupInput = z.infer<typeof AuditSignupSchema>;
export type BarristerInput = z.infer<typeof BarristerSchema>;
export type BriefInput = z.infer<typeof BriefSchema>;
export type NoteInput = z.infer<typeof NoteSchema>;
