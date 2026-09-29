import {ApiError} from "../errors";
import {clearSession, getSession, setSession} from "../session";
import type {User} from "../types/user";

export type LoginCredentials = {
	email: string;
	password: string;
};

type MockAccount = {
	password: string;
	user: User;
};

// Mock de autenticação: ainda não há backend, então as credenciais são
// validadas aqui. Trocar por uma chamada em `apiClient.post("/auth/login", ...)`
// quando a API existir — a assinatura de `login` não muda.
const mockAccounts: MockAccount[] = [
	{
		password: "talentlens123",
		user: {
			id: "1",
			name: "Ana Souza",
			email: "ana.souza@talentlens.com",
			role: "admin",
			status: "active",
		},
	},
];

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function login(credentials: LoginCredentials): Promise<User> {
	await delay(700);

	const account = mockAccounts.find(
		(entry) =>
			entry.user.email.toLowerCase() === credentials.email.trim().toLowerCase() &&
			entry.password === credentials.password,
	);

	if (!account) {
		throw new ApiError("E-mail ou senha inválidos.", "unauthorized", 401);
	}

	setSession(account.user, `mock-token-${account.user.id}`);
	return account.user;
}

export function logout(): void {
	clearSession();
}

export function getCurrentUser(): Promise<User | null> {
	return Promise.resolve(getSession()?.user ?? null);
}
