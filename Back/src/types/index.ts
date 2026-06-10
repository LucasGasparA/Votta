export enum ProposalStatus {
  DRAFT    = 'DRAFT',
  REVIEW   = 'REVIEW',
  APPROVED = 'APPROVED',
}

export enum UserRole {
  USER  = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id:        string
  email:     string
  name:      string
  role:      UserRole
  settings:  string
  createdAt: Date
  updatedAt: Date
}

export interface Municipality {
  id:        string
  ibgeId:    string
  name:      string
  state:     string
  createdAt: Date
  updatedAt: Date
}

export interface Proposal {
  id:                 string
  title:              string
  type:               string
  theme:              string | null
  objective:          string | null
  competence:         string | null
  hasFinancialImpact: boolean | null
  estimatedImpact:    string | null
  justification:      string | null
  content:            string
  status:             ProposalStatus
  userId:             string
  municipalityId:     string
  municipality?:      Municipality
  createdAt:          Date
  updatedAt:          Date
}

export interface ProposalVersion {
  id:            string
  proposalId:    string
  content:       string
  versionNumber: number
  createdAt:     Date
}
