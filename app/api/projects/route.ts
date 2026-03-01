import { verifyToken } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const projectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional()
})

async function getAuthenticatedUser(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    return await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: { id: true, teamId: true, role: true }
    });
}


export async function GET(request: NextRequest) {
    try{
        const user = await getAuthenticatedUser(request);
        if (!user || !user.teamId) {
            return NextResponse.json({ status: 'ERROR', message: "Unauthorized" }, { status: 401 });
        }    
        
        const projects= await prisma.project.findMany({
            where: {teamId: user.teamId},
            orderBy: {createdAt: 'desc'}
        });

        return NextResponse.json({status: 'SUCCESS', projects})
    }catch(error){
        console.error('Error fetching projects:', error);
        return NextResponse.json({status: 'ERROR', message: 'Internal Server Error'}, {status: 500})
    }
}

// DELETE the 'import { stat } from "fs";' line at the top!

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user || !user.teamId) {
            return NextResponse.json({ status: 'ERROR', message: "Unauthorized" }, { status: 401 });
        }

        // Optional RBAC: Only let Admins or Managers create projects
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json({ status: 'ERROR', message: "Forbidden" }, { status: 403 });
        }

        // 1. Get the JSON body from the request
        const body = await request.json().catch(() => ({}));
        
        // 2. Validate it using Zod
        const validation = projectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { status: 'ERROR', errors: validation.error.flatten().fieldErrors }, 
                { status: 400 }
            );
        }

        // 3. Actually CREATE the project in the database!
        const project = await prisma.project.create({
            data: {
                name: validation.data.name,
                description: validation.data.description,
                teamId: user.teamId, // Tenant Isolation!
            }
        });

        return NextResponse.json({ status: 'SUCCESS', project }, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ status: 'ERROR', message: "internal server error" }, { status: 500 });
    }
}

