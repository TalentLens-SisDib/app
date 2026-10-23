import type {User} from "../types/user";

/** Editar e remover competências é exclusivo de administradores (criar é livre). */
export function canManageSkills(user: User | undefined): boolean {
	return user?.role === "Admin";
}
