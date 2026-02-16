import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/lib/db';
import { generateToken, hashPassword, verifyPassword } from "@/app/lib/auth";
import { Role } from "@/app/types";
export async function POST(request:NextRequest){
    try {
        //extracting the data
        const body = await request.json().catch(() => ({}));
        const { name, email, password, teamCode } = body;

        //validating the data
        const missing = [
            !email && 'email',
            !password && 'password',
        ].filter(Boolean) as string[];

        if (missing.length) {
            return NextResponse.json(
                {
                    status: 'ERROR',
                    message: 'Email and password are required.',
                    missing,
                },
                { status: 400 }
            );
        }

        // Prisma Team.code is String; coerce if client sends number (e.g. JSON 2134)

        const userFromDb= await prisma.user.findUnique( {
            where: {
                email: email
            },
            include: {
                team: true
            }
        })

        if(!userFromDb){
            return NextResponse.json( {
                message: "Invalid email or password.",
            },
        {
            status: 400,
        })
        }

        const isValidPassword = await verifyPassword(password, userFromDb.password);

        if(!isValidPassword){
            return NextResponse.json( {
                message: "Invalid email or password.",
            },
        {
            status: 400,
        })
        }

        const userCount= await prisma.user.count();
        const role= userCount === 0 ? Role.ADMIN : Role.USER;

      

        const token = generateToken(userFromDb.id);

        const response = NextResponse.json({
            user: {
                id: userFromDb.id,
                name: userFromDb.name,
                email: userFromDb.email,
                role: userFromDb.role,
                teamId: userFromDb.teamId,
                team: userFromDb.team,
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
        console.error('Error in login route:', error);
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