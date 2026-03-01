import { logActivity } from "@/app/lib/audit";
import { verifyToken } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { taskSchema } from "@/app/lib/validators";
import { NextRequest, NextResponse } from "next/server";


async function getAuthenticatedUser(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if(!token){
        return null;
    }
    const payload = await verifyToken(token);
    if(!payload?.userId){
        return null;
    }
    return await prisma.user.findUnique( {
        where: {id:payload.userId as string},
        select: {id:true, teamId:true, role:true}
    } )
}



export async function POST(request: NextRequest){
    try{
        const user= await getAuthenticatedUser(request);

        if(!user ||  !user.teamId){
            return NextResponse.json({
                status: 'ERROR',
                message: 'Unauthorized. Please log in.'
            },
        {
            status: 401,
        })
        }

        const body = await request.json().catch(() => ({}));

        const validation= taskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                status: 'ERROR',
                message: 'Validation failed.',
                errors: validation.error.flatten().fieldErrors // <--- ADD THIS
            }, { status: 400 });
        }

    const {title, projectId, assigneeId, status}= validation.data;

    //check if the project belongs to the user's team
    const project = await prisma.project.findUnique({
        where: {id: projectId}
    })
    
    if(!project || project.teamId !== user.teamId){
        return NextResponse.json({
            status: 'ERROR',
            message: 'Project not found or does not belong to your team.'
        },
    {
        status: 404
    })
    }

    if(assigneeId){
        const assignee = await prisma.user.findUnique({
            where: {id: assigneeId}
        });

        if(!assignee || assignee.teamId !== user.teamId){
            return NextResponse.json({
                status: 'ERROR',
                message: 'Assignee not found or does not belong to your team.'
            },
        {
            status: 404
        })
        }
    }

    const task = await prisma.task.create({
        data: {
            title,
            status,
            projectId,
            assigneeId
        },
        include: {
            assignee: {select: {name:true, email:true}},
        }
    });

    await logActivity({
        teamId: user.teamId,
        userId: user.id,
        action : 'CREATE_TASK',
        entityId: task.id,
        entityType: 'TASK',
        details: `Tasks created with status: ${task.status}`
    })

    return NextResponse.json({
        status: 'SUCCESS',
        message: 'Task created successfully.',
        task
    })
    }catch(error){
        console.error('Error in creating task:', error);
        return NextResponse.json({
            status: 'ERROR',
            message: 'Internal server error.'
        },
        {
            status: 500
        })
    }
}