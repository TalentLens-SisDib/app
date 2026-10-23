import type {JobOpening} from "../types/jobOpening";
import type {User} from "../types/user";

/** Espelha a regra da API: o criador da vaga ou um administrador. */
export function canManageJobOpening(user: User | undefined, jobOpening: JobOpening): boolean {
	if (!user) return false;
	return user.role === "Admin" || user.id === jobOpening.userId;
}

/** Editar e remover competências é exclusivo de administradores (criar é livre). */
export function canManageSkills(user: User | undefined): boolean {
	return user?.role === "Admin";
}
