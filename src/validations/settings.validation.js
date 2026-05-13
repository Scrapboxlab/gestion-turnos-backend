const { z } = require('zod');

const updateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const updateHoursSchema = z.object({
  hours: z.array(businessHourSchema),
});

const updateBookingRulesSchema = z.object({
  minNoticeHours: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().min(1).optional(),
  autoConfirm: z.boolean().optional(),
  allowCancellation: z.boolean().optional(),
  cancellationHours: z.number().int().min(0).optional(),
});

module.exports = { updateBusinessSchema, updateHoursSchema, updateBookingRulesSchema };
