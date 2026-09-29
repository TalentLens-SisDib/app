export type UserRole = "admin" | "recruiter" | "manager";
export type UserStatus = "active" | "inactive";

export type User = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
};

export type CreateUserInput = Omit<User, "id">;
export type UpdateUserInput = Partial<CreateUserInput>;
