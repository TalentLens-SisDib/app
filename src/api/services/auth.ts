import {apiClient} from "../client";
import {ApiError} from "../errors";
import {clearSession, getSession, setSession} from "../session";
import type {User, UserRole} from "../../types/user";

export type LoginCredentials = {
	email: string;
	password: string;
};

type LoginResponse = {
	accessToken: string;
	tokenType: "Bearer";
	expiresIn: number;
};

// Claims do JWT emitido por POST /login (ver AuthPayload na API). O token
// não é verificado no cliente — só decodificado para extrair os dados do
// usuário autenticado, já que a API não expõe um endpoint "/me".
type AccessTokenClaims = {
	sub: number;
	name: string;
	email: string;
	role: UserRole;
	companyId: number;
};

function decodeAccessToken(token: string): AccessTokenClaims {
	const payload = token.split(".")[1];
	if (!payload) throw new ApiError("Token de acesso inválido.", "server");

	try {
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(base64)) as AccessTokenClaims;
	} catch {
		throw new ApiError("Token de acesso inválido.", "server");
	}
}

export async function login(credentials: LoginCredentials): Promise<User> {
	const response = await apiClient.post<LoginResponse>("/login", credentials);
	const claims = decodeAccessToken(response.accessToken);

	const user: User = {
		id: claims.sub,
		name: claims.name,
		email: claims.email,
		role: claims.role,
		companyId: claims.companyId,
	};

	setSession(user, response.accessToken);
	return user;
}

export function logout(): void {
	clearSession();
}

export function getCurrentUser(): Promise<User | null> {
	return Promise.resolve(getSession()?.user ?? null);
}
