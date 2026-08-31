/**
 * Design system view-model types.
 *
 * These are the camelCase shapes the design system components take as props.
 * They are NOT the database schema -- types/database.ts stays snake_case and
 * remains the single source of truth for Supabase rows. Map rows to these at
 * the page boundary (see lib/viewModels/).
 *
 * UserRole is re-exported from ./database so there is only one definition.
 */

/**
 * These mirror `types/database.ts` in the hsnef/member-portal repo.
 * Field names are camelCase here; map at the page boundary (see utils/viewModels.ts).
 */

import type { UserRole } from './database';
export type { UserRole };

export const STAFF_ROLES: UserRole[] = ['Office Staff', 'Office Manager', 'Admin'];

export type MemberClass = 'Personal' | 'Business';
export type MembershipLevel = 'Lifetime' | 'Annual' | 'Community';
export type MembershipStatus = 'Active' | 'Expired' | 'Cancelled' | 'Pending';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  nakshatra?: string;
  dateOfBirth?: string;
}

export interface Member {
  id: string;
  membershipId: string;
  memberClass: MemberClass;
  level: MembershipLevel;
  status: MembershipStatus;
  firstName: string;
  lastName: string;
  businessName?: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  gotra?: string;
  nakshatra?: string;
  memberSince: string;
  validUntil: string | null;
  isFoundingMember: boolean;
  spouseName?: string;
  familyMembers: FamilyMember[];
}

export type PaymentCategory =
'Membership' |
'Donation' |
'Service' |
'Event' |
'Facility Rental';

export type PaymentMethod = 'Card' | 'Check' | 'Cash' | 'Zelle';

export interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  category: PaymentCategory;
  description: string;
  taxDeductible: boolean;
  memberName?: string;
  membershipId?: string;
}

export type RequestStatus =
'Pending Approval' |
'Approved' |
'Awaiting Payment' |
'Paid' |
'Completed' |
'Cancelled';

export type RequestType =
'Puja' |
'Sponsorship' |
'Service' |
'Facility Rental' |
'Donation Request';

export interface ServiceRequest {
  id: string;
  reference: string;
  type: RequestType;
  serviceName: string;
  requestedDate: string;
  location: 'Inside the temple' | 'Outside the temple';
  amount: number;
  status: RequestStatus;
  purohit?: string;
  notes?: string;
  createdAt: string;
  memberName?: string;
  membershipId?: string;
}

export interface TempleService {
  id: string;
  name: string;
  category: 'Archana & Offerings' | 'Abhishekam & Puja' | 'Havan' | 'Samskaras' | 'Ancestral Rites';
  description: string;
  memberInside?: number;
  nonMemberInside?: number;
  memberOutside?: number;
  nonMemberOutside?: number;
  walkInOnly?: boolean;
  popular?: boolean;
}

export interface TempleEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: 'Festival' | 'Cultural' | 'Youth' | 'Seva' | 'Class';
  capacity: number;
  registered: number;
  memberPrice: number;
  nonMemberPrice: number;
  registrationDeadline: string;
  imageUrl: string;
  isRegistered: boolean;
}

export interface DonationFund {
  id: string;
  name: string;
  blurb: string;
  raised: number;
  goal: number;
}

export interface Purohit {
  id: string;
  name: string;
  specialties: string[];
  phone: string;
  email: string;
  languages: string[];
  isActive: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}