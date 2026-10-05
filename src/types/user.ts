export type UserRole = "Admin" | "Recruiter";

export type User = {
	id: number;
	name: string;
	email: string;
	role: UserRole;
	companyId: number;
};

export type CreateUserInput = {
	email: string;
	name?: string;
	password: string;
	role?: UserRole;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
	password?: string;
};
