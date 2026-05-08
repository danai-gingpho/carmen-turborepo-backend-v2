/** @format */

import { PrismaClient } from '../generated/client';
import {
	createAuditPrismaExtension,
	AuditBufferManager,
	AuditFileWriter,
	AuditDbWriter,
	LogEventsConfig,
} from '@repo/log-events-library';

const DEFAULT_CONNECTION_LIMIT = 10;

function ensureConnectionLimit(url: string): string {
	if (url.includes('connection_limit')) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}connection_limit=${DEFAULT_CONNECTION_LIMIT}`;
}

const clients: {
	[key: string]: { client: PrismaClient; datasourceURL: string } | null;
} = {};

// Use composite key (tenantId:datasourceURL) to ensure audit logs go to correct schema
const auditManagers: Map<string, AuditBufferManager> = new Map();

const getAuditManagerKey = (tenantId: string, datasourceURL: string): string => {
	// Extract schema from datasourceURL for the key
	const schemaMatch = datasourceURL.match(/schema=([^&]+)/);
	const schema = schemaMatch ? schemaMatch[1] : 'default';
	return `${tenantId}:${schema}`;
};

const getAuditConfig = (): LogEventsConfig => ({
	logDirectory: process.env.AUDIT_LOG_DIR || './logs/audit',
	filePrefix: 'tenant-audit',
	rotationStrategy: 'daily',
	bufferSize: 100,
	flushIntervalMs: 5000,
	excludeModels: ['_prisma_migrations', 'tb_activity'],
	sensitiveFields: ['password', 'hash', 'token', 'secret', 'api_key'],
	saveToDatabase: true,
	saveToFile: false,
});

const getOrCreateAuditManager = (tenantId: string, datasourceURL: string, prismaClient?: any): AuditBufferManager => {
	const managerKey = getAuditManagerKey(tenantId, datasourceURL);

	if (!auditManagers.has(managerKey)) {
		const config = getAuditConfig();
		// Extract schema for directory naming
		const schemaMatch = datasourceURL.match(/schema=([^&]+)/);
		const schema = schemaMatch ? schemaMatch[1] : tenantId;

		const tenantConfig = {
			...config,
			logDirectory: `${config.logDirectory}/${schema}`,
		};

		// Create file writer only if saveToFile is enabled
		const fileWriter = tenantConfig.saveToFile !== false ? new AuditFileWriter(tenantConfig) : null;

		// Create database writer if saveToDatabase is enabled and prismaClient is provided
		const dbWriter = tenantConfig.saveToDatabase && prismaClient
			? new AuditDbWriter(tenantConfig, { prismaClient })
			: null;

		const manager = new AuditBufferManager(fileWriter, tenantConfig, dbWriter);
		auditManagers.set(managerKey, manager);

		console.log(`[AuditManager] Created new audit manager for schema: ${schema}`);
	}
	return auditManagers.get(managerKey)!;
};

const updateAuditManagerWithClient = (tenantId: string, datasourceURL: string, prismaClient: any): void => {
	const managerKey = getAuditManagerKey(tenantId, datasourceURL);
	const manager = auditManagers.get(managerKey);
	if (manager) {
		const config = getAuditConfig();
		if (config.saveToDatabase) {
			const dbWriter = new AuditDbWriter(config, { prismaClient });
			manager.setDbWriter(dbWriter);
		}
	}
};

const trimStringValues = (data: any): any => {
	if (typeof data === 'string') {
		return data.trim();
	}

	if (Array.isArray(data)) {
		return data.map(item => trimStringValues(item));
	}

	if (
		data &&
		typeof data === 'object' &&
		Object.getPrototypeOf(data) === Object.prototype
	) {
		const trimmed: any = {};
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				trimmed[key] = trimStringValues(data[key]);
			}
		}
		return trimmed;
	}

	return data;
};

const beforeCreate = (_tenantId: string, _model: string, args: any) => {
	if (args.data) {
		args.data = trimStringValues(args.data);
	}

	return args;
};

const beforeUpdate = (_tenantId: string, _model: string, args: any) => {
	if (args.data) {
		args.data = trimStringValues(args.data);
	}

	return args;
};


export const PrismaClient_TENANT = async (tenantId: string, datasourceURL: string) => {
	let clientData = clients[tenantId];

	if (clientData) {
		if (clientData.datasourceURL !== datasourceURL) {
			await clientData.client.$disconnect();
			clientData = null;
		} else {
			await clientData.client.$connect();
			return clientData.client;
		}
	}

	if (!clientData) {
		const baseClient = new PrismaClient({
			datasources: {
				db: {
					url: ensureConnectionLimit(datasourceURL),
				},
			},
			// log: [
			// 	// { emit: 'stdout', level: 'query' },
			// 	// { emit: 'stdout', level: 'info' },
			// 	// { emit: 'stdout', level: 'warn' },
			// 	// { emit: 'stdout', level: 'error' },
			// ],
		});

		// Pass baseClient for database audit logging (uses base client to avoid infinite loops)
		// Use datasourceURL to ensure audit logs go to the correct schema
		const auditManager = getOrCreateAuditManager(tenantId, datasourceURL, baseClient);
		const auditConfig = getAuditConfig();

		// Models that don't have deleted_at field
		const modelsWithoutSoftDelete = new Set([
			'tb_user_profile',
			'tb_inventory_transaction_detail',
			'tb_good_received_note_detail',
		]);

		const addSoftDeleteFilter = (model: string, args: any) => {
			// Skip soft delete filter for models without deleted_at field
			if (modelsWithoutSoftDelete.has(model)) {
				return args;
			}
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

		const extendedClient = baseClient.$extends({
			query: {
				$allModels: {
					async findUnique({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async findUniqueOrThrow({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async findFirst({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async findFirstOrThrow({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async findMany({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async count({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async aggregate({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async groupBy({ model, args, query }) {
						const modifiedArgs = addSoftDeleteFilter(model, args);
						return query(modifiedArgs);
					},
					async create({ model, args, query }) {
						const modifiedArgs = beforeCreate(tenantId, model, args);
						return query(modifiedArgs);
					},
					async update({ model, args, query }) {
						const modifiedArgs = beforeUpdate(tenantId, model, args);
						return query(modifiedArgs);
					},
					async updateMany({ model, args, query }) {
						const modifiedArgs = beforeUpdate(tenantId, model, args);
						return query(modifiedArgs);
					},
					async createMany({ model, args, query }) {
						const modifiedArgs = beforeCreate(tenantId, model, args);
						return query(modifiedArgs);
					},
					async upsert({ model, args, query }) {
						const modifiedArgs = {
							...args,
							create: args.create ? trimStringValues(args.create) : args.create,
							update: args.update ? trimStringValues(args.update) : args.update,
						};
						return query(modifiedArgs);
					},
				},
			},
		});

		// Second extension: audit logging
		const client = extendedClient.$extends(
			createAuditPrismaExtension(tenantId, auditManager, auditConfig),
		) as unknown as PrismaClient;

		// Test the database connection
		try {
			await client.$connect();
			clients[tenantId] = { client, datasourceURL };
			return clients[tenantId]!.client;
		} catch (error: unknown) {
			if (clientData != null) {
				await clientData.client.$disconnect();
				delete clients[tenantId];
			}
			throw new Error(`Failed to connect to the database for tenant: ${tenantId}`);
		}
	}
	return null;
};

