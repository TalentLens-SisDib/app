import {setAuthToken} from "./client";
import type {User} from "../types/user";

/**
 * Sessão autenticada (usuário + tokens), persistida em localStorage e
 * sincronizada com `client.ts` via `setAuthToken`. Módulo puro, sem
 * dependência de React — components consomem via hooks/useSession.
 */

const STORAGE_KEY = "auth_session";

export type Session = {
	user: User;
	/** Access token (JWT) enviado em `Authorization` nas chamadas à API. */
	token: string;
	/** Troca por um novo access token em `POST /login/refresh`. */
	refreshToken: string;
	/** Epoch em ms. */
	refreshExpiresAt: number;
};

export type SessionTokens = {
	accessToken: string;
	refreshToken: string;
	/** Validade do refresh token, em segundos (como a API devolve). */
	refreshExpiresIn: number;
};

function isUsable(value: unknown): value is Session {
	if (!value || typeof value !== "object") return false;
	const session = value as Partial<Session>;
	// Sessões gravadas antes do refresh token não conseguem renovar: descartadas.
	return (
		typeof session.token === "string" &&
		typeof session.refreshToken === "string" &&
		typeof session.refreshExpiresAt === "number" &&
		session.refreshExpiresAt > Date.now()
	);
}

function readFromStorage(): Session | null {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		return isUsable(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function persist(next: Session | null): void {
	try {
		if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		else window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// localStorage indisponível (ex.: modo privado) — sessão segue só em memória.
	}
}

let session: Session | null = readFromStorage();
if (!session) persist(null);
setAuthToken(session?.token ?? null);

// Sessão caiu sozinha (refresh vencido/inválido): a tela de login avisa até o próximo login.
let expiredNotice = false;

const listeners = new Set<() => void>();

function notify(): void {
	for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getSession(): Session | null {
	return session;
}

export function setSession(user: User, tokens: SessionTokens): void {
	session = {
		user,
		token: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		refreshExpiresAt: Date.now() + tokens.refreshExpiresIn * 1000,
	};
	expiredNotice = false;
	persist(session);
	setAuthToken(session.token);
	notify();
}

/** Troca só o access token (e os dados do usuário, que vêm atualizados nele). */
export function updateAccessToken(user: User, accessToken: string): void {
	if (!session) return;
	session = {...session, user, token: accessToken};
	persist(session);
	setAuthToken(accessToken);
	notify();
}

/** `expired` marca que a sessão caiu sozinha (não foi logout). */
export function clearSession(options: {expired?: boolean} = {}): void {
	if (!session) return;
	session = null;
	expiredNotice = Boolean(options.expired);
	persist(null);
	setAuthToken(null);
	notify();
}

/** Se a última sessão expirou (em vez de terminar por logout). Limpo no próximo login. */
export function wasSessionExpired(): boolean {
	return expiredNotice;
}
