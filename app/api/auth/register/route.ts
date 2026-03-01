import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/lib/db';
import { generateToken, hashPassword } from "@/app/lib/auth";
import { Role } from "@/app/types";
import { registerSchema } from "@/app/lib/validators";
import { count } from "console";
// export async function POST(request:NextRequest){
//     try {
//         //extracting the data
//         const body = await request.json().catch(() => ({}));
//         const { name, email, password, teamCode } = body;

//         //validating the data
//         const missing = [
//             !name && 'name',
//             !email && 'email',
//             !password && 'password',
//             !teamCode && 'teamCode',
//         ].filter(Boolean) as string[];

//         if (missing.length) {
//             return NextResponse.json(
//                 {
//                     status: 'ERROR',
//                     message: 'All fields are required.',
//                     missing,
//                 },
//                 { status: 400 }
//             );
//         }

//         // Prisma Team.code is String; coerce if client sends number (e.g. JSON 2134)
//         const teamCodeStr = String(teamCode);

//         const existingUser= await prisma.user.findUnique( {
//             where: {
//                 email: email
//             }
//         })

//         if(existingUser){
//             return NextResponse.json(
//                 {
//                     status: 'ERROR',
//                     message: 'User already exists.'
//                 },
//                 {
//                     status: 400
//                 }
//             )
//         }

//         let teamId: string | null = null;
//         if(teamCodeStr){
//             const team = await prisma.team.findUnique({
//                 where: { code: teamCodeStr }
//             })

//             if(!team){
//                 return NextResponse.json(
//                     {
//                         status: 'ERROR',
//                         message: 'Team not found.',
//                         code: teamCodeStr,
//                     },
//                     { status: 400 }
//                 );
//             }
//             teamId = team.id;
//         } 

//         const hashedPassword = await hashPassword(password);

//         const userCount= await prisma.user.count();
//         const role= userCount === 0 ? Role.ADMIN : Role.USER;


//         const user= await prisma.user.create({
//             data: {
//                 name,
//                 email,
//                 password : hashedPassword,
//                 role,
//                 teamId
//             },
//             include: {
//                 team: true
//             }
//         });

//         const token = generateToken(user.id);

//         const response = NextResponse.json({
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//                 teamId: user.teamId,
//                 team: user.team,
//                 token
//             },
//         })

//         response.cookies.set('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             maxAge: 60 * 60 * 24 * 30,
//             sameSite: 'lax'
//         });

//         return response;
//     } catch (error) {
//         console.error('Error in register route:', error);
//         return NextResponse.json(
//             {
//                 status: 'ERROR',
//                 message: 'Internal server error.'
//             },
//             {
//                 status: 500
//             }
//         )
//     }
// }

// app/api/auth/register/route.ts
// Helper to generate a simple random code if you don't use a library
function generateTeamCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: NextRequest){
    try{
        const body = await request.json().catch(() => ({}));

        // 1. Zod Validation
        const validation = registerSchema.safeParse(body);

        if(!validation.success){
            return NextResponse.json(
                {
                    status: 'ERROR',
                    message: 'Validation Failed', // Fixed typo
                    errors: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { name, email, password, teamCode } = validation.data;

        // 2. Check Existing User
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if(existingUser){
            return NextResponse.json(
                { status: 'ERROR', message: 'User already exists.' },
                { status: 400 }
            );
        }

        // 3. Team Handling Logic (The Major Upgrade)
        let teamId: string;
        let userRole: Role;

        if (teamCode) {
            // SCENARIO A: JOINING EXISTING TEAM
            const team = await prisma.team.findUnique({
                where: { code: teamCode }
            });

            if (!team) {
                return NextResponse.json(
                    { status: 'ERROR', message: 'Invalid Team Code' },
                    { status: 400 }
                );
            }
            teamId = team.id;
            userRole = Role.USER; // Joiners are standard users
        } else {
            // SCENARIO B: CREATING NEW TEAM
            const newCode = generateTeamCode();
            
            // Create the team FIRST
            const newTeam = await prisma.team.create({
                data: {
                name: `${name}'s Team`, // Default name, can be changed later
                    code: newCode,
                }
            });
            
            teamId = newTeam.id;
            userRole = Role.ADMIN; // Creators are Admins
        }

        // 4. Create User
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: userRole, // Use the role determined above
                teamId
            },
            include: {
                team: true
            }
        });

        // 5. Issue Token & Response
        const token = generateToken(user.id);
        const response = NextResponse.json({
            status: 'SUCCESS',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                team: user.team,
                // We don't strictly need to send 'token' in JSON if using cookies, 
                // but it helps for debugging or mobile apps.
            },
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30,
            sameSite: 'lax'
        });

        return response;

    } catch(error) {
        console.error('Error in register route:', error);
        return NextResponse.json(
            { status: 'ERROR', message: 'Internal server error.' },
            { status: 500 }
        );
    }
}