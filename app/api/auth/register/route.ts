import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/lib/db';
import { generateToken, hashPassword } from "@/app/lib/auth";
import { Role } from "@/app/types";
export async function POST(request:NextRequest){
    try {
        //extracting the data
        const body = await request.json().catch(() => ({}));
        const { name, email, password, teamCode } = body;

        //validating the data
        const missing = [
            !name && 'name',
            !email && 'email',
            !password && 'password',
            !teamCode && 'teamCode',
        ].filter(Boolean) as string[];

        if (missing.length) {
            return NextResponse.json(
                {
                    status: 'ERROR',
                    message: 'All fields are required.',
                    missing,
                },
                { status: 400 }
            );
        }

        // Prisma Team.code is String; coerce if client sends number (e.g. JSON 2134)
        const teamCodeStr = String(teamCode);

        const existingUser= await prisma.user.findUnique( {
            where: {
                email: email
            }
        })

        if(existingUser){
            return NextResponse.json(
                {
                    status: 'ERROR',
                    message: 'User already exists.'
                },
                {
                    status: 400
                }
            )
        }

        let teamId: string | null = null;
        if(teamCodeStr){
            const team = await prisma.team.findUnique({
                where: { code: teamCodeStr }
            })

            if(!team){
                return NextResponse.json(
                    {
                        status: 'ERROR',
                        message: 'Team not found.',
                        code: teamCodeStr,
                    },
                    { status: 400 }
                );
            }
            teamId = team.id;
        } 

        const hashedPassword = await hashPassword(password);

        const userCount= await prisma.user.count();
        const role= userCount === 0 ? Role.ADMIN : Role.USER;


        const user= await prisma.user.create({
            data: {
                name,
                email,
                password : hashedPassword,
                role,
                teamId
            },
            include: {
                team: true
            }
        });

        const token = generateToken(user.id);

        const response = NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamId: user.teamId,
                team: user.team,
                token
            },
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30,
            sameSite: 'lax'
        });

        return response;
    } catch (error) {
        console.error('Error in register route:', error);
        return NextResponse.json(
            {
                status: 'ERROR',
                message: 'Internal server error.'
            },
            {
                status: 500
            }
        )
    }
}