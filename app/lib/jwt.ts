// app/lib/jwt.ts
import { jwtVerify, SignJWT } from "jose";

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length === 0) {
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    return new TextEncoder().encode(secret);
};

export async function verifyToken(token: string) {
    try {
        const verified = await jwtVerify(token, getSecretKey());
        return verified.payload;
    } catch (error) {
        return null;
    }
}

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(getSecretKey());
}