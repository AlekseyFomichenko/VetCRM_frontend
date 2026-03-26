import { z } from "zod";

export const guidSchema = z
  .string()
  .uuid()
  .describe("GUID string");

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("YYYY-MM-DD");

export const isoDateTimeSchema = z
  .string()
  .refine((s) => {
    const t = Date.parse(s);
    return !Number.isNaN(t);
  }, "Invalid ISO 8601 DateTime");

export const nullableStringSchema = z.string().nullable();
export const nullableGuidSchema = guidSchema.nullable();

export enum UserRoleNumber {
  Admin = 0,
  Veterinarian = 1,
  Receptionist = 2,
}

export enum UserStatusNumber {
  Active = 0,
  Disabled = 1,
}

export enum ClientStatusNumber {
  Active = 1,
  Archived = 2,
}

export enum PetStatusNumber {
  Active = 1,
  Archived = 2,
  Deceased = 3,
}

export enum AppointmentStatusNumber {
  Scheduled = 1,
  Cancelled = 2,
  Rescheduled = 3,
  Completed = 4,
  NoShow = 5,
}

export enum ReminderTypeNumber {
  VaccinationDue = 0,
  AppointmentTomorrow = 1,
}

export enum ReminderStatusNumber {
  Sent = 0,
  Failed = 1,
}

export enum ReminderChannelNumber {
  Demo = 0,
  Email = 1,
  Sms = 2,
}

export const userRoleNumberSchema = z.nativeEnum(UserRoleNumber);
export const userStatusNumberSchema = z.nativeEnum(UserStatusNumber);
export const clientStatusNumberSchema = z.nativeEnum(ClientStatusNumber);
export const petStatusNumberSchema = z.nativeEnum(PetStatusNumber);
export const appointmentStatusNumberSchema = z.nativeEnum(
  AppointmentStatusNumber,
);

export const reminderTypeNumberSchema = z.nativeEnum(ReminderTypeNumber);
export const reminderStatusNumberSchema = z.nativeEnum(ReminderStatusNumber);
export const reminderChannelNumberSchema = z.nativeEnum(ReminderChannelNumber);

export const ReminderTypeStringSchema = z.enum([
  "VaccinationDue",
  "AppointmentTomorrow",
]);

export const ReminderChannelStringSchema = z.enum(["Demo", "Email", "Sms"]);
export const ReminderStatusStringSchema = z.enum(["Sent", "Failed"]);

export const AuthRegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: userRoleNumberSchema,
});

export const AuthLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AuthRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const AuthResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: isoDateTimeSchema,
  userId: guidSchema,
  email: z.string().email(),
  role: z.string().min(1),
});

export const ClientResponseSchema = z.object({
  id: guidSchema,
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: nullableStringSchema,
  address: nullableStringSchema,
  notes: nullableStringSchema,
  status: clientStatusNumberSchema,
  createdAt: dateOnlySchema,
});

export const GetClientsResponseSchema = z.object({
  items: z.array(ClientResponseSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const CreateClientResponseSchema = z.object({
  clientId: guidSchema,
});

export const PetResponseSchema = z.object({
  id: guidSchema,
  clientId: nullableGuidSchema,
  name: z.string().min(1),
  species: z.string().min(1),
  birthDate: dateOnlySchema.nullable(),
  status: petStatusNumberSchema,
});

export const GetPetsResponseSchema = z.object({
  items: z.array(PetResponseSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const CreatePetResponseSchema = z.object({
  petId: guidSchema,
});

export const AppointmentResponseSchema = z.object({
  id: guidSchema,
  petId: guidSchema,
  clientId: guidSchema,
  veterinarianUserId: nullableGuidSchema,
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  status: appointmentStatusNumberSchema,
  reason: nullableStringSchema,
  createdByUserId: nullableGuidSchema,
  createdAt: isoDateTimeSchema,
});

export const CreateAppointmentResponseSchema = z.object({
  appointmentId: guidSchema,
});

export const MedicalRecordResponseSchema = z.object({
  id: guidSchema,
  appointmentId: guidSchema,
  petId: guidSchema,
  veterinarianUserId: nullableGuidSchema,
  complaint: z.string().min(1),
  diagnosis: z.string().min(1),
  treatmentPlan: z.string().min(1),
  prescription: z.string().min(1),
  attachments: nullableStringSchema,
  createdAt: dateOnlySchema,
  vaccinations: z.array(
    z.object({
      id: guidSchema,
      medicalRecordId: guidSchema,
      vaccineName: z.string().min(1),
      vaccinationDate: dateOnlySchema,
      nextDueDate: dateOnlySchema.nullable(),
      batch: nullableStringSchema,
      manufacturer: nullableStringSchema,
    }),
  ),
});

export const UpdateMedicalRecordRequestSchema = z.object({
  complaint: z.string(),
  diagnosis: z.string(),
  treatmentPlan: z.string(),
  prescription: z.string(),
  attachments: z.string().nullable().optional(),
});

export const AddVaccinationRequestSchema = z.object({
  vaccineName: z.string().min(1),
  vaccinationDate: dateOnlySchema,
  nextDueDate: dateOnlySchema.nullable().optional(),
  batch: nullableStringSchema.optional(),
  manufacturer: nullableStringSchema.optional(),
});

export const AppointmentsReportItemResponseSchema = z.object({
  id: guidSchema,
  petId: guidSchema,
  clientId: guidSchema,
  veterinarianUserId: nullableGuidSchema,
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  status: appointmentStatusNumberSchema,
  reason: nullableStringSchema,
  createdAt: isoDateTimeSchema,
});

export const AppointmentsReportResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  items: z.array(AppointmentsReportItemResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const OverdueVaccinationItemResponseSchema = z.object({
  vaccinationId: guidSchema,
  petId: guidSchema,
  vaccineName: z.string().min(1),
  nextDueDate: dateOnlySchema,
  isOverdue: z.boolean(),
  clientFullName: nullableStringSchema,
  clientPhone: nullableStringSchema,
  clientEmail: nullableStringSchema,
});

export const OverdueVaccinationsReportResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  items: z.array(OverdueVaccinationItemResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const UserResponseSchema = z.object({
  id: guidSchema,
  email: z.string().email(),
  role: z.string().min(1),
  fullName: nullableStringSchema,
  status: z.string().min(1),
  createdAt: isoDateTimeSchema,
});

export const GetUsersResponseSchema = z.object({
  items: z.array(UserResponseSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const ProcessVaccinationRemindersResponseSchema = z.object({
  created: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export const ReminderLogResponseSchema = z.object({
  id: guidSchema,
  type: ReminderTypeStringSchema,
  targetClientId: nullableGuidSchema,
  targetPetId: nullableGuidSchema,
  channel: ReminderChannelStringSchema,
  payload: z.string(),
  status: ReminderStatusStringSchema,
  createdAt: isoDateTimeSchema,
  error: nullableStringSchema,
});

export const DomainErrorJsonResponseSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().nonnegative(),
  detail: z.unknown().nullable(),
  traceId: z.string().nullable().optional(),
});

