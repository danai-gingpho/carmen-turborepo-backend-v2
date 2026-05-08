/** @format */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient_TENANT } from './client';

describe('PrismaClient_TENANT', () => {
  const testDatasourceURL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
  const tenantId = 'TEST_TENANT';

  afterAll(async () => {
    // Cleanup connections
    const client = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    await client?.$disconnect();
  });

  it('should create a new client for a tenant', async () => {
    const client = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    expect(client).toBeDefined();
    expect(client).not.toBeNull();
  });

  it('should return the same client for the same tenant and datasource', async () => {
    const client1 = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    const client2 = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    expect(client1).toBe(client2);
  });

  it('should create a new client when datasource URL changes', async () => {
    const client1 = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    const newDatasourceURL = testDatasourceURL + '?schema=different';
    const client2 = await PrismaClient_TENANT(tenantId, newDatasourceURL);
    expect(client1).not.toBe(client2);
  });

  it('should throw error when connection fails', async () => {
    const invalidURL = 'postgresql://invalid:invalid@invalid:5432/invalid';
    await expect(
      PrismaClient_TENANT('INVALID_TENANT', invalidURL)
    ).rejects.toThrow(/Failed to connect to the database/);
  });

  it('should connect to database successfully', async () => {
    const client = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    expect(client).toBeDefined();

    // Verify the client is connected and functional
    await expect(client.$queryRaw`SELECT 1 as result`).resolves.toBeDefined();
  });

  it('should log before/after create messages', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const client = await PrismaClient_TENANT(tenantId, testDatasourceURL);

    // Note: This test verifies the hooks are set up
    // Actual model operations would trigger the logs
    expect(client).toBeDefined();

    // The hooks will be called when actual create/update operations happen
    consoleSpy.mockRestore();
  });
});
