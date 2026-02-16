import { PrismaClient } from '../generated/prisma/client';

export const prisma = new PrismaClient();

export async function CheckDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.log('Database connection error:', error);
        return false;
    }
}