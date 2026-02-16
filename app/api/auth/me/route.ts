import { getCurrentUser } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const user = await getCurrentUser();
        if(!user){
            return NextResponse.json( {
                message: "Unauthorized",
            },
            {
                status: 401,
            }
            )
        }

        return NextResponse.json( {
            user
        } )
    }catch(error){
        console.error('Error in me route:', error);
        return NextResponse.json( {
            message: "Internal server error.",
        },
        {
            status: 500,
        }
        )
    }
}