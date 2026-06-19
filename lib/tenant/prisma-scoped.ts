import { prisma } from '@/lib/prisma';
import type { Prisma } from '../../prisma/generated/prisma/client';

/** Scoped Prisma helpers — always injects tenantId */
export function scopedPrisma(tenantId: string) {
  const withTenant = <T extends Record<string, unknown>>(where?: T) =>
    ({ ...where, tenantId }) as T & { tenantId: string };

  return {
    booking: {
      findMany: (args?: Omit<Prisma.BookingFindManyArgs, 'where'> & { where?: Prisma.BookingWhereInput }) =>
        prisma.booking.findMany({ ...args, where: withTenant(args?.where) }),
      findFirst: (args?: Omit<Prisma.BookingFindFirstArgs, 'where'> & { where?: Prisma.BookingWhereInput }) =>
        prisma.booking.findFirst({ ...args, where: withTenant(args?.where) }),
      findUnique: (args: { where: { id: string } }) =>
        prisma.booking.findFirst({ where: { id: args.where.id, tenantId } }),
      create: (args: { data: Omit<Prisma.BookingUncheckedCreateInput, 'tenantId'> }) =>
        prisma.booking.create({ data: { ...args.data, tenantId } }),
      update: (args: { where: { id: string }; data: Prisma.BookingUpdateInput }) =>
        prisma.booking.updateMany({
          where: { id: args.where.id, tenantId },
          data: args.data as Prisma.BookingUpdateManyMutationInput,
        }),
      count: (args?: { where?: Prisma.BookingWhereInput }) =>
        prisma.booking.count({ where: withTenant(args?.where) }),
    },
    user: {
      findMany: (args?: Omit<Prisma.UserFindManyArgs, 'where'> & { where?: Prisma.UserWhereInput }) =>
        prisma.user.findMany({ ...args, where: withTenant(args?.where) }),
      findFirst: (args?: Omit<Prisma.UserFindFirstArgs, 'where'> & { where?: Prisma.UserWhereInput }) =>
        prisma.user.findFirst({ ...args, where: withTenant(args?.where) }),
      count: (args?: { where?: Prisma.UserWhereInput }) =>
        prisma.user.count({ where: withTenant(args?.where) }),
      create: (args: { data: Omit<Prisma.UserUncheckedCreateInput, 'tenantId'> }) =>
        prisma.user.create({ data: { ...args.data, tenantId } }),
      update: (args: { where: { id: string }; data: Prisma.UserUpdateInput }) =>
        prisma.user.updateMany({
          where: { id: args.where.id, tenantId },
          data: args.data as Prisma.UserUpdateManyMutationInput,
        }),
      delete: (args: { where: { id: string } }) =>
        prisma.user.deleteMany({ where: { id: args.where.id, tenantId } }),
    },
    blockedSlot: {
      findMany: (args?: Omit<Prisma.BlockedSlotFindManyArgs, 'where'> & { where?: Prisma.BlockedSlotWhereInput }) =>
        prisma.blockedSlot.findMany({ ...args, where: withTenant(args?.where) }),
      findFirst: (args?: Omit<Prisma.BlockedSlotFindFirstArgs, 'where'> & { where?: Prisma.BlockedSlotWhereInput }) =>
        prisma.blockedSlot.findFirst({ ...args, where: withTenant(args?.where) }),
      create: (args: { data: Omit<Prisma.BlockedSlotUncheckedCreateInput, 'tenantId'> }) =>
        prisma.blockedSlot.create({ data: { ...args.data, tenantId } }),
      deleteMany: (args: { where: Prisma.BlockedSlotWhereInput }) =>
        prisma.blockedSlot.deleteMany({ where: withTenant(args.where) }),
    },
    settings: {
      findUnique: () => prisma.tenantSettings.findUnique({ where: { tenantId } }),
      upsert: (args: { create: Omit<Prisma.TenantSettingsUncheckedCreateInput, 'tenantId'>; update: Prisma.TenantSettingsUpdateInput }) =>
        prisma.tenantSettings.upsert({
          where: { tenantId },
          create: { ...args.create, tenantId },
          update: args.update,
        }),
    },
    service: {
      findMany: (args?: Omit<Prisma.ServiceFindManyArgs, 'where'> & { where?: Prisma.ServiceWhereInput }) =>
        prisma.service.findMany({ ...args, where: withTenant(args?.where) }),
      findFirst: (args?: Omit<Prisma.ServiceFindFirstArgs, 'where'> & { where?: Prisma.ServiceWhereInput }) =>
        prisma.service.findFirst({ ...args, where: withTenant(args?.where) }),
      create: (args: { data: Omit<Prisma.ServiceUncheckedCreateInput, 'tenantId'> }) =>
        prisma.service.create({ data: { ...args.data, tenantId } }),
      update: (args: { where: { id: string }; data: Prisma.ServiceUpdateInput }) =>
        prisma.service.updateMany({
          where: { id: args.where.id, tenantId },
          data: args.data as Prisma.ServiceUpdateManyMutationInput,
        }),
      delete: (args: { where: { id: string } }) =>
        prisma.service.deleteMany({ where: { id: args.where.id, tenantId } }),
    },
  };
}

export async function assertBarberInTenant(barberId: string, tenantId: string): Promise<boolean> {
  const db = scopedPrisma(tenantId);
  const barber = await db.user.findFirst({
    where: { id: barberId, role: { in: ['barbero', 'dueno'] }, isActive: true },
  });
  return !!barber;
}
