/** Official role codes — extensible via DB, not a closed product enum forever */
export type RoleCode =
  | 'client'
  | 'patrimonial_partner'
  | 'certified_agent'
  | 'administrator'
  | 'super_administrator'
  | (string & {});

/** Permission codes — capabilities, not roles */
export type PermissionCode =
  | 'platform.access'
  | 'admin.panel'
  | 'executive.panel'
  | 'reputation.manage'
  | 'properties.manage'
  | 'housing.explore'
  | 'agent.operate'
  | 'trust.manage'
  | 'contracts.manage'
  | 'finance.manage'
  | 'finance.read'
  | (string & {});

export type TrustDocType = 'identity' | 'proof_of_address' | 'property_title' | 'agent_credential';

export type TrustDocStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export type TrustDocument = {
  id: string;
  userId: string;
  propertyId: string | null;
  docType: TrustDocType;
  status: TrustDocStatus;
  notes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KycLevel = 0 | 1 | 2 | 3 | 4;

export type VerificationStatus = 'missing' | 'pending' | 'verified' | 'rejected';

export type IdDocKind = 'bi' | 'passport' | 'residence_card' | 'other';

export type IdentityPartySnapshot = {
  userId: string;
  legalFullName: string | null;
  preferredName: string | null;
  displayName: string | null;
  sex: string | null;
  birthDate: string | null;
  nationality: string | null;
  placeOfBirth: string | null;
  maritalStatus: string | null;
  email: string | null;
  emailConfirmed: boolean;
  emailSecondary: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  phoneVerified: boolean;
  avatarUrl: string | null;
  kycLevel: KycLevel;
  trustIndex: number;
  /** Alias of trustIndex — User Trust Score */
  uts?: number;
  kisCompleteness?: number;
  livenessStatus?: string;
  document: {
    id?: string;
    kind: IdDocKind;
    number: string;
    issuedOn: string | null;
    expiresOn: string | null;
    issuedAt: string | null;
    issuingCountry: string;
    status: string;
    ocrStatus?: string;
    encryptionScheme?: string;
  } | null;
  address: {
    country: string;
    province: string | null;
    municipality: string | null;
    commune: string | null;
    neighborhood: string | null;
    street: string | null;
    number: string | null;
    postalCode: string | null;
    gpsLat?: number | null;
    gpsLng?: number | null;
    line: string | null;
  } | null;
};

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial';
export type PropertyPurpose = 'rent' | 'sale' | 'both';
export type PropertyStatus = 'draft' | 'active' | 'archived';
export type AgentAssignmentStatus = 'active' | 'released';
export type ContractPurpose = 'rent' | 'sale';
export type ContractStatus = 'draft' | 'pending_acceptance' | 'active' | 'completed' | 'cancelled';

export type ClientPreferences = {
  userId: string;
  purpose: PropertyPurpose | null;
  province: string | null;
  city: string | null;
  updatedAt: string;
};

export type AgentAssignment = {
  id: string;
  agentId: string;
  propertyId: string;
  status: AgentAssignmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface Property {
  id: string;
  ownerId: string;
  code: string;
  title: string;
  propertyType: PropertyType;
  purpose: PropertyPurpose;
  province: string | null;
  city: string | null;
  addressLine: string | null;
  status: PropertyStatus;
  notes: string | null;
  priceAoa: number | null;
  bedrooms: number | null;
  coverImageUrl: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyContract {
  id: string;
  code: string;
  propertyId: string;
  clientId: string;
  partnerId: string;
  agentId: string | null;
  interestId: string | null;
  purpose: ContractPurpose;
  status: ContractStatus;
  amountAoa: number;
  currency: 'AOA';
  title: string;
  termsNotes: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: PermissionCode;
  description: string | null;
}

export interface UserRole {
  userId: string;
  roleId: string;
  roleCode: RoleCode;
  assignedAt: string;
  assignedBy: string | null;
}

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  legalFullName?: string | null;
  preferredName?: string | null;
  kycLevel?: KycLevel;
  trustIndex?: number;
  kycIdentityStatus?: VerificationStatus;
  kycDocumentStatus?: VerificationStatus;
  kycAddressStatus?: VerificationStatus;
  kycBankingStatus?: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: string;
  email: string | null;
  profile: Profile | null;
  roles: RoleCode[];
}

export type AppErrorCode =
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface AppError {
  code: AppErrorCode;
  message: string;
  status: number;
  details?: unknown;
}

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  timestamp: string;
}
