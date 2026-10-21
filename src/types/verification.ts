import type { Id, IsoDateTime } from './api'
import type { AviatorCredentials, KycStatus } from './user'

export type KycDocumentType = 'passport' | 'drivers_licence' | 'national_id' | 'pilot_licence'

export type KycStep = 'personal_details' | 'id_document' | 'selfie' | 'review'

export interface KycSession {
  id: Id
  status: KycStatus
  step: KycStep
  documentType?: KycDocumentType | null
  personal?: { legalFirstName: string; legalLastName: string; dateOfBirth: string; nationality: string } | null
  documentFront?: { mediaId: Id; checks: { label: string; passed: boolean }[] } | null
  /** Short-lived hand-off URL rendered as a QR code for the mobile selfie step. */
  handoffUrl?: string | null
  rejectionReason?: string | null
  submittedAt?: IsoDateTime | null
}

export interface KycPersonalPayload {
  legalFirstName: string
  legalLastName: string
  dateOfBirth: string
  nationality: string
}

export interface KycDocumentPayload {
  documentType: KycDocumentType
  frontMediaId: Id
  backMediaId?: Id | null
}

export interface AviatorApplicationPayload {
  licenceType: AviatorCredentials['licenceType']
  licenceNumber: string
  issuingAuthority: string
  jobTitle?: string
  organisation?: string
  typeRatings: string[]
  licenceMediaId: Id
}
