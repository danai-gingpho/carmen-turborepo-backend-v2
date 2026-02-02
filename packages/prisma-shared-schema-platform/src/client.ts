/** @format */

import { PrismaClient } from '../generated/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Helper to add soft delete filter to where clause
// Skip filter if deleted_at is explicitly specified in the query
const addSoftDeleteFilter = (args: any) => {
	if (args?.where && 'deleted_at' in args.where) {
		return args;
	}
	return {
		...args,
		where: {
			...args?.where,
			deleted_at: null,
		},
	};
};

const createExtendedClient = () => {
	const baseClient = new PrismaClient();

	return baseClient.$extends({
		query: {
			$allModels: {
				async findUnique({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async findUniqueOrThrow({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async findFirst({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async findFirstOrThrow({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async findMany({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async count({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async aggregate({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
				async groupBy({ model, args, query }) {
					const modifiedArgs = addSoftDeleteFilter(args);
					return query(modifiedArgs);
				},
			},
		},
	}) as unknown as PrismaClient;
};

export const prisma_system = globalForPrisma.prisma || createExtendedClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma_system;
