/** @format */

import { PrismaClient } from "../generated/client/index";

export const PrismaClient_SYSTEM = new PrismaClient();
export const PrismaClient_SYSTEM_CUSTOM = async (url: string) =>
  new PrismaClient({
    datasources: {
      db: { url },
    },
  });

export * from "../generated/client/index";
