import { verifyToken } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
    try{
        const token= request.cookies.get("token")?.value;
        if(!token){
            return NextResponse.json({status:'ERROR',message:'Unauthorized. Please log in.'}, {status:401})
        }

        const payload= await verifyToken(token);

        if(!payload?.userId){
            return NextResponse.json({status:'ERROR',message:'Unauthorized. Please log in.'}, {status:401})
        }

        const user=await prisma.user.findUnique({
            where: {id: payload.userId as string},
            select: {teamId:true, role:true}
        })

        if(!user || !user.teamId){
            return NextResponse.json({status:'ERROR',message:"Unauthorized"},{status:401})
        }

        if(user.role === 'USER' || user.role === 'GUEST'){
            return NextResponse.json({status: 'ERROR', message: "Forbidden. Insufficient permissions."}, {status:403})
        }

        const logs = await prisma.auditLog.findMany({
            where: { teamId: user.teamId },
            orderBy: { createdAt: 'desc' },
            take: 50, // Best practice: limit the payload size
            include: {
                user: { select: { name: true, email: true } } // Include the name of the person who did the action
            }
        });

        return NextResponse.json({status: 'SUCCESS',logs})
    }catch(error){
        console.error('Error fetching audit logs:',error)
        return NextResponse.json({status:'ERROR',message:'Internal Server Error'},{status:500})
    }
}