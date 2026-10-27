import {apiClient, setTokenRefresher} from "../client";
import {ApiError, isApiError} from "../errors";
import {clearSession, getSession, setSession, updateAccessToken} from "../session";
import type {User, UserRole} from "../../types/user";

export type LoginCredentials = {
	email: string;
	password: string;
};

type RefreshResponse = {
	accessToken: string;
	tokenType: "Bearer";
	/** Validade do access token, em segundos. */
	expiresIn: number;
};

type LoginResponse = RefreshResponse & {
	refreshToken: string;
	/** Validade do refresh token, em segundos. */
	refreshExpiresIn: number;
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

function userFromAccessToken(token: string): User {
	const claims = decodeAccessToken(token);
	return {
		id: claims.sub,
		name: claims.name,
		email: claims.email,
		role: claims.role,
		companyId: claims.companyId,
	};
}

export async function login(credentials: LoginCredentials): Promise<User> {
	const response = await apiClient.post<LoginResponse>("/login", credentials, {
		skipAuthRefresh: true,
	});
	const user = userFromAccessToken(response.accessToken);

	setSession(user, response);
	return user;
}

/**
 * Troca o refresh token por um novo access token (`POST /login/refresh`, com
 * o refresh token no header `Authorization`). O refresh token não é renovado:
 * quando ele vence, a sessão cai e o usuário volta ao login.
 *
 * Devolve o novo access token, ou `null` se a sessão não pôde ser renovada.
 * Falha de rede é relançada — a sessão continua e a próxima chamada tenta de novo.
 */
async function refreshAccessToken(): Promise<string | null> {
	const refreshToken = getSession()?.refreshToken;
	if (!refreshToken) return null;

	try {
		const response = await apiClient.post<RefreshResponse>("/login/refresh", undefined, {
			skipAuthRefresh: true,
			headers: {Authorization: `Bearer ${refreshToken}`},
		});
		// O token novo traz os dados atuais do usuário (nome, papel...).
		updateAccessToken(userFromAccessToken(response.accessToken), response.accessToken);
		return response.accessToken;
	} catch (error) {
		if (isApiError(error) && error.status === 401) {
			clearSession({expired: true});
			return null;
		}
		throw error;
	}
}

/** Liga a renovação automática de token no client. Chamado uma vez em `main.tsx`. */
export function initAuth(): void {
	setTokenRefresher(refreshAccessToken);
}

export function logout(): void {
	clearSession();
}

export function getCurrentUser(): Promise<User | null> {
	return Promise.resolve(getSession()?.user ?? null);
}
