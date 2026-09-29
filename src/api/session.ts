import {setAuthToken} from "./client";
import type {User} from "./types/user";

/**
 * Sessão mockada, persistida em localStorage enquanto não existe
 * autenticação real (sem refresh token, sem expiração). Módulo puro,
 * sem dependência de React — components consomem via hooks/useSession.
 */

const STORAGE_KEY = "auth_session";

export type Session = {
	user: User;
	token: string;
};

function readFromStorage(): Session | null {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Session) : null;
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
setAuthToken(session?.token ?? null);

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

export function setSession(user: User, token: string): void {
	session = {user, token};
	persist(session);
	setAuthToken(token);
	notify();
}

export function clearSession(): void {
	session = null;
	persist(null);
	setAuthToken(null);
	notify();
}
