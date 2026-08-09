import { z } from 'zod';

export const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial'] as const;
export const PROPERTY_PURPOSES = ['rent', 'sale', 'both'] as const;
export const PROPERTY_STATUSES = ['draft', 'active', 'archived'] as const;

/** Serviços pretendidos da Kuteka (Manual Cap.7 / Cap.9 / Cap.11). */
export const KUTEKA_SERVICES = [
  'announce',
  'find_buyer',
  'find_tenant',
  'rental_management',
  'full_management',
  'evaluation',
  'photography',
  'technical_visit',
  'renovation',
  'renewal',
  'construction_finish',
  'home_staging',
  'cleaning',
  'maintenance',
  'works_supervision',
  'condo_admin',
] as const;

export const MANAGEMENT_LEVELS = [
  'announce_only',
  'find_buyer',
  'find_tenant',
  'rental_management',
  'full_management',
] as const;

export const RENOVATION_REQUESTS = [
  'full_renovation',
  'partial_renovation',
  'painting',
  'electricity',
  'plumbing',
  'roof',
  'kitchen',
  'bathrooms',
  'facade',
  'gardening',
  'landscaping',
  'decoration',
  'home_staging',
] as const;

export const UNFINISHED_INTENTS = [
  'none',
  'kuteka_finish',
  'budget_only',
  'technical_supervision',
  'works_evaluation',
] as const;

export const CONSTRUCTION_STATUSES = [
  'complete',
  'partial',
  'not_started',
  'needs_finish',
] as const;

export const CONSERVATION_STATES = [
  'excellent',
  'good',
  'fair',
  'needs_work',
  'ruin',
  'under_construction',
] as const;

export const COMMISSION_SETTLEMENTS = [
  'immediate',
  'after_first_rent',
  'automatic_retention',
] as const;

const optionalTrimmed = z.string().trim().max(160).optional().or(z.literal(''));

const optionalPositive = z
  .number({ invalid_type_error: 'Indique um valor válido.' })
  .positive()
  .max(1_000_000_000_000)
  .optional()
  .nullable();

const optionalNonNegInt = z
  .number({ invalid_type_error: 'Indique um número válido.' })
  .int()
  .min(0)
  .max(200)
  .optional()
  .nullable();

const optionalBool = z.boolean().optional().nullable();

export function propertyRequiresEvaluation(
  services: readonly string[],
  management: string | null | undefined,
): boolean {
  if (management === 'rental_management' || management === 'full_management') return true;
  const gated = new Set([
    'full_management',
    'rental_management',
    'evaluation',
    'technical_visit',
    'construction_finish',
    'renovation',
    'renewal',
    'works_supervision',
  ]);
  return services.some((s) => gated.has(s));
}

export const activatePropertySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Indique um título com pelo menos 3 caracteres.')
      .max(120, 'O título é demasiado longo.'),
    propertyType: z.enum(PROPERTY_TYPES, {
      errorMap: () => ({ message: 'Seleccione o tipo de património.' }),
    }),
    purpose: z.enum(PROPERTY_PURPOSES, {
      errorMap: () => ({ message: 'Seleccione a finalidade.' }),
    }),
    managementLevel: z.enum(MANAGEMENT_LEVELS, {
      errorMap: () => ({ message: 'Seleccione o nível de gestão pretendido.' }),
    }),
    requestedServices: z
      .array(z.enum(KUTEKA_SERVICES))
      .min(1, 'Seleccione pelo menos um serviço Kuteka.'),
    renovationRequests: z.array(z.enum(RENOVATION_REQUESTS)).default([]),
    unfinishedIntent: z.enum(UNFINISHED_INTENTS).default('none'),
    constructionStatus: z.enum(CONSTRUCTION_STATUSES).optional().nullable(),
    conservationState: z.enum(CONSERVATION_STATES).optional().nullable(),
    province: optionalTrimmed,
    municipality: optionalTrimmed,
    commune: optionalTrimmed,
    city: optionalTrimmed,
    neighborhood: optionalTrimmed,
    addressLine: optionalTrimmed,
    streetNumber: z.string().trim().max(40).optional().or(z.literal('')),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
    priceAoa: optionalPositive,
    bedrooms: optionalNonNegInt,
    bathrooms: optionalNonNegInt,
    suites: optionalNonNegInt,
    parkingSpaces: optionalNonNegInt,
    furnished: optionalBool,
    hasGarage: optionalBool,
    hasYard: optionalBool,
    hasPool: optionalBool,
    hasGarden: optionalBool,
    hasAnnex: optionalBool,
    hasEquippedKitchen: optionalBool,
    hasBalcony: optionalBool,
    hasTerrace: optionalBool,
    landAreaM2: optionalPositive,
    builtAreaM2: optionalPositive,
    areaTotalM2: optionalPositive,
    areaUsefulM2: optionalPositive,
    yearBuilt: z
      .number({ invalid_type_error: 'Indique um ano válido.' })
      .int()
      .min(1800)
      .max(2100)
      .optional()
      .nullable(),
    latitude: z
      .number({ invalid_type_error: 'Latitude inválida.' })
      .min(-90)
      .max(90)
      .optional()
      .nullable(),
    longitude: z
      .number({ invalid_type_error: 'Longitude inválida.' })
      .min(-180)
      .max(180)
      .optional()
      .nullable(),
    hasPipedWater: optionalBool,
    hasElectricity: optionalBool,
    hasGenerator: optionalBool,
    hasInternet: optionalBool,
    hasSecurity: optionalBool,
    hasPavedStreet: optionalBool,
    nearSchools: optionalBool,
    nearHospitals: optionalBool,
    nearMarkets: optionalBool,
    nearTransport: optionalBool,
    commissionSettlement: z.enum(COMMISSION_SETTLEMENTS).optional().nullable(),
    status: z.enum(PROPERTY_STATUSES).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.constructionStatus === 'partial' || data.constructionStatus === 'needs_finish') &&
      data.unfinishedIntent === 'none'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique a intenção para o imóvel inacabado.',
        path: ['unfinishedIntent'],
      });
    }
  });

export const expressInterestSchema = z.object({
  propertyId: z.string().uuid('Património inválido.'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type ActivatePropertyInput = z.infer<typeof activatePropertySchema>;
export type ExpressInterestInput = z.infer<typeof expressInterestSchema>;
export type KutekaService = (typeof KUTEKA_SERVICES)[number];
export type ManagementLevel = (typeof MANAGEMENT_LEVELS)[number];
