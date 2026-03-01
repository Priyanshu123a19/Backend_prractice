
import { prisma } from "./db";

interface AuditProps {
    teamId: string;
    userId: string;
    action: string;
    entityId: string;
    entityType: string;
    details?: string;
}

export async function logActivity(props: AuditProps){
    try{
        await prisma.auditLog.create({
            data: props
        });
    }catch(error){
        console.error('Failed to log activity:', error);
    }
}