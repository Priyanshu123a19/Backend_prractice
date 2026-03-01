// import { NextResponse } from "next/server";

import { stat } from "fs";
import { NextResponse } from "next/server";

// export async function POST(){
//     const response = NextResponse.json(
//         {
//             message: "Logged out sucessfully."
//         },
//         {
//             status: 200,
//         }
//     );
     
//     response.cookies.set("token","", {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         maxAge: 0,
//         sameSite: 'lax'
//     })

//     return response;
// }

export async function POST(){
    try{
        const response = NextResponse.json({
            status: 'SUCCESS',
            message:'Logged out successfully.'
            }
        )

        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
            sameSite: 'lax'
        });

        return response;
    }catch(error){
        console.error('error in logout route:', error);
        return NextResponse.json(
            {status: 'ERROR', message: 'Internal server error.'},
            {status: 500}
        )
    }
}