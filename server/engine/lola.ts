/**
 * Lola Marketing Follow-up Engine
 *
 * Generates the client-facing response message based on the intake outcome.
 * Pure function — decision in, message out.
 */

import type { Decision } from './ultracore.js';

export interface LolaResponse {
  message: string;
  callToAction: string;
  tone: 'urgent' | 'reassuring' | 'standard' | 'rejection';
  nextStep: string;
}

export function lolaFollowUp(input: {
  name: string;
  issueType: string;
  urgency: string;
  decision: Decision;
  riskScore: number;
}): LolaResponse {
  const { name, issueType, decision, riskScore } = input;
  const firstName = name.trim().split(' ')[0];

  switch (decision) {
    case 'ESCALATE':
      return {
        message: `Hi ${firstName}, your ${issueType} matter has been flagged as high priority (risk score: ${riskScore}/100). A senior solicitor has been notified and will contact you within the hour. Please keep your phone available.`,
        callToAction: 'A solicitor will call you shortly',
        tone: 'urgent',
        nextStep: 'Human review — expected within 1 hour',
      };

    case 'MODIFY':
      return {
        message: `Hi ${firstName}, we've received your ${issueType} enquiry. Your matter has been scored at ${riskScore}/100 and requires a brief solicitor review before we proceed. You'll receive a confirmation within 24 hours.`,
        callToAction: 'Check your email for next steps',
        tone: 'reassuring',
        nextStep: 'Solicitor review — expected within 24 hours',
      };

    case 'DENY':
      return {
        message: `Hi ${firstName}, we weren't able to process your ${issueType || 'enquiry'} as submitted. Please complete all required fields and resubmit. If you need help, call our intake line.`,
        callToAction: 'Please resubmit with full details',
        tone: 'rejection',
        nextStep: 'Resubmission required',
      };

    case 'ALLOW':
    default:
      return {
        message: `Hi ${firstName}, your ${issueType} intake has been successfully created (risk score: ${riskScore}/100). Lunar has assessed your matter as standard priority and it's now queued for matter creation.`,
        callToAction: 'Your matter reference will arrive by email',
        tone: 'standard',
        nextStep: 'Matter creation — automated, within 15 minutes',
      };
  }
}
