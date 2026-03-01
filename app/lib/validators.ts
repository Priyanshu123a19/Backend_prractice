import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, {message: 'Name must be at least 2 characters long'}),
    email: z.string().email({message: 'Invalid email address'}),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long'}),
    teamCode: z.string().optional(),
})

//this will direclty call this as a type so that we can use it in the route handler
export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema=z.object({
    email:z.string().email("invalid email format"),
    password:z.string().min(1,"Password is required")
})

export type LoginSchema= z.infer<typeof loginSchema>;

export const taskSchema = z.object( {
    title:z.string().min(1,"Task title is required"),
    projectId:z.string().min(1,"Project ID is required"),
    assigneeId: z.string().optional().nullable(),
    status: z.enum(["TODO","IN_PROGRESS","REVIEW","DONE"]).default("TODO")
})

export type TaskSchema = z.infer<typeof taskSchema>;