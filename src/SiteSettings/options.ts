export const DAYS = [
  { value: 'monday', nl: 'Maandag', en: 'Monday', schema: 'https://schema.org/Monday' },
  { value: 'tuesday', nl: 'Dinsdag', en: 'Tuesday', schema: 'https://schema.org/Tuesday' },
  { value: 'wednesday', nl: 'Woensdag', en: 'Wednesday', schema: 'https://schema.org/Wednesday' },
  { value: 'thursday', nl: 'Donderdag', en: 'Thursday', schema: 'https://schema.org/Thursday' },
  { value: 'friday', nl: 'Vrijdag', en: 'Friday', schema: 'https://schema.org/Friday' },
  { value: 'saturday', nl: 'Zaterdag', en: 'Saturday', schema: 'https://schema.org/Saturday' },
  { value: 'sunday', nl: 'Zondag', en: 'Sunday', schema: 'https://schema.org/Sunday' },
] as const

export type DayValue = (typeof DAYS)[number]['value']

export const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'other', label: 'Andere / Other' },
] as const

/** Common schema.org LocalBusiness subtypes for Flemish SMEs. */
export const SCHEMA_TYPES = [
  'LocalBusiness',
  'ProfessionalService',
  'Restaurant',
  'CafeOrCoffeeShop',
  'Bakery',
  'BarOrPub',
  'Store',
  'HairSalon',
  'BeautySalon',
  'HealthAndBeautyBusiness',
  'Dentist',
  'Physician',
  'MedicalClinic',
  'LegalService',
  'AccountingService',
  'RealEstateAgent',
  'AutoRepair',
  'HomeAndConstructionBusiness',
  'Electrician',
  'Plumber',
  'HVACBusiness',
  'GeneralContractor',
  'ExerciseGym',
  'LodgingBusiness',
] as const
