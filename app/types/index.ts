export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUEST = 'GUEST',
    MANAGER = 'MANAGER'
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    teamId?: string;
    team?: Team;
    createdAt: Date;
    updatedAt: Date;
}

export interface Team {
    id: string;
    name: string;
    description?: string | null;
    code: string;
    members: User[];
    createdAt: Date;
    updatedAt: Date;
}