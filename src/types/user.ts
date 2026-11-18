export type UserRole = "Admin" | "Recruiter";

export type User = {
	id: number;
	name: string;
	email: string;
	role: UserRole;
	companyId: number;
	/** Ausente em sessões cujo token foi emitido antes de a API incluir a empresa. */
	companyName?: string;
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
