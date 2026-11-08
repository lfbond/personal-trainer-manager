
export const restrictionTypes = [
  'JOINT',
  'MUSCULAR',
  'BONE',
  'CARDIOVASCULAR',
  'RESPIRATORY',
  'NEUROLOGICAL',
  'OTHER',
] as const

export const bodyRegions = [
  'NECK',
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'HAND',
  'SPINE',
  'HIP',
  'KNEE',
  'ANKLE',
  'FOOT',
  'CHEST',
  'OTHER',
] as const

export type RestrictionType =
  (typeof restrictionTypes)[number]

export type BodyRegion =
  (typeof bodyRegions)[number]

export interface StudentRestriction {
  id: string
  studentId: string
  type: RestrictionType
  bodyRegion: BodyRegion
  description: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentRestrictionFormData {
  type: RestrictionType
  bodyRegion: BodyRegion
  description: string
  notes: string | null
}

export type UpdateStudentRestrictionData =
  Partial<StudentRestrictionFormData>

export const restrictionTypeLabels: Record<RestrictionType, string> = {
  JOINT: 'Articular',
  MUSCULAR: 'Muscular',
  BONE: 'Óssea',
  CARDIOVASCULAR: 'Cardiovascular',
  RESPIRATORY: 'Respiratória',
  NEUROLOGICAL: 'Neurológica',
  OTHER: 'Outra',
}

export const bodyRegionLabels: Record<BodyRegion, string> = {
  NECK: 'Pescoço',
  SHOULDER: 'Ombro',
  ELBOW: 'Cotovelo',
  WRIST: 'Punho',
  HAND: 'Mão',
  SPINE: 'Coluna',
  HIP: 'Quadril',
  KNEE: 'Joelho',
  ANKLE: 'Tornozelo',
  FOOT: 'Pé',
  CHEST: 'Tórax',
  OTHER: 'Outra',
}
