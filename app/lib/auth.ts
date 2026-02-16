import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { Role, User } from '../types';
const JWT_SECRET = process.env.JWT_SECRET!;

export const hashPassword = async(password:string): Promise<string> => {
    return await bcrypt.hash(password, 12);
}

export const verifyPassword = async(password:string,hashedPassword:string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
}

export const generateToken = (userId:string):string => {
    return jwt.sign({userId}, JWT_SECRET, {expiresIn: '1h'});
}

export const verifyToken =(token:string): {userId:string} => {
    return jwt.verify(token, JWT_SECRET) as {userId:string};
}

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const cookieStore= await cookies();
        const token = cookieStore.get('token')?.value;
        if(!token){
            return null;
        }
        const decoded = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            }
        });
        if(!user){
            return null;
        }
        const {password, ...userWithoutPassword} = user;
        return userWithoutPassword as User;
    } catch (error) {
        console.error("error in getCurrentUser:", error);
        return null;
    }
}


export const checkUserPermission = async (user:User, requiredPermission:Role): Promise<boolean> => {
     const roleHeirarchy = {
        [Role.ADMIN]: 3,
        [Role.MANAGER]: 2,
        [Role.USER]: 1,
        [Role.GUEST]: 0,
     };
     return roleHeirarchy[user.role] >= roleHeirarchy[requiredPermission];
}
