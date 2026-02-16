import { CheckDatabaseConnection } from "@/app/lib/db";
import { stat } from "fs";
import { NextResponse } from "next/server";
export async function GET() {
    const isConnected = await CheckDatabaseConnection();

    if(isConnected){
        return NextResponse.json(
            {
            status: 'OK',
            message: 'Database connection is healthy.'
            },
            {
                status: 200
            }
        )
    }
    return NextResponse.json(
        {
        status: 'ERROR',
        message: 'Database connection is not healthy.'
        },
        {
            status: 500
        }
    )
}