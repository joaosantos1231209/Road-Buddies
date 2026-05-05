import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function parseIntParam(value: string | string[] | undefined): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) return null;
  const n = parseInt(str, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? "Dados inválidos",
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ─── Schemas ────────────────────────────────────────────────────────────────

export const createTripSchema = z.object({
  type: z.enum(["PROVIDER", "NEEDRIDE"]),
  originId: z.coerce.number().int().positive(),
  destinationId: z.coerce.number().int().positive(),
  departureTime: z.string().min(1, "Data obrigatória"),
  returnTime: z.string().nullable().optional(),
  availableSeats: z.coerce.number().int().min(0).max(8).optional(),
  vehicleType: z.string().max(100).nullable().optional(),
  tripVehicleDetails: z.string().max(500).nullable().optional(),
  companyVehicleId: z.coerce.number().int().positive().nullable().optional(),
});

export const createCompanyVehicleSchema = z.object({
  brand: z.string().min(1, "Marca obrigatória").max(100),
  model: z.string().min(1, "Modelo obrigatório").max(100),
  plate: z.string().min(1, "Matrícula obrigatória").max(10),
  officeId: z.coerce.number().int().positive("Escritório obrigatório"),
});

export const createSpRequestSchema = z.object({
  originId: z.coerce.number().int().positive().optional().nullable(),
  destinationId: z.coerce.number().int().positive(),
  dateNeeded: z.string().min(1, "Data obrigatória"),
  justification: z.string().max(1000).optional(),
});

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, "O código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "O código deve conter apenas dígitos"),
});

export const updateProfileSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  phone: z
    .string()
    .regex(/^\d{9}$/, "O telemóvel deve ter 9 dígitos")
    .optional()
    .or(z.literal("")),
  vehicleInfo: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(2000, "Mensagem demasiado longa"),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
});
