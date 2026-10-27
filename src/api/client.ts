import {ApiError, errorKindForStatus} from "./errors";

const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// Token de acesso mantido em memória. Único ponto de leitura/escrita —
// services nunca manipulam headers de autenticação diretamente.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
	authToken = token;
}

/**
 * Renova o access token quando a API responde 401. Registrado por
 * `services/auth.ts` (via `initAuth`) para o client não depender da sessão.
 * Devolve o novo token, ou `null` se não foi possível renovar.
 */
type TokenRefresher = () => Promise<string | null>;

let tokenRefresher: TokenRefresher | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setTokenRefresher(refresher: TokenRefresher | null): void {
	tokenRefresher = refresher;
}

/** Várias chamadas recebendo 401 ao mesmo tempo compartilham uma única renovação. */
function refreshOnce(): Promise<string | null> {
	if (!tokenRefresher) return Promise.resolve(null);
	refreshInFlight ??= tokenRefresher()
		.catch(() => null)
		.finally(() => {
			refreshInFlight = null;
		});
	return refreshInFlight;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	/** Não tenta renovar o token em caso de 401 (login e o próprio refresh). */
	skipAuthRefresh?: boolean;
};

/**
 * `FormData` passa intacto e sem `Content-Type`: o browser precisa definir
 * o header com o `boundary` do multipart.
 */
function isMultipart(body: unknown): body is FormData {
	return typeof FormData !== "undefined" && body instanceof FormData;
}

type ErrorBody = {message?: string; details?: unknown};

async function readErrorBody(response: Response): Promise<ErrorBody> {
	try {
		const data: unknown = await response.clone().json();
		if (data && typeof data === "object" && "message" in data) {
			const message = (data as {message?: unknown}).message;
			return {
				message: typeof message === "string" ? message : undefined,
				details: data,
			};
		}
		return {details: data};
	} catch {
		return {};
	}
}

async function request<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const {body, headers, skipAuthRefresh, ...rest} = options;
	const multipart = isMultipart(body);

	async function send(token: string | null): Promise<Response> {
		try {
			return await fetch(`${baseUrl}${path}`, {
				...rest,
				headers: {
					...(multipart ? {} : {"Content-Type": "application/json"}),
					...(token ? {Authorization: `Bearer ${token}`} : {}),
					...headers,
				},
				body: multipart
					? body
					: body !== undefined
						? JSON.stringify(body)
						: undefined,
			});
		} catch (error) {
			// Cancelamento não é falha de rede: o chamador precisa do AbortError.
			if (error instanceof DOMException && error.name === "AbortError") throw error;
			throw new ApiError("Não foi possível conectar à API.", "network");
		}
	}

	const sentToken = authToken;
	let response = await send(sentToken);

	// Access token expirado: renova uma vez e repete a chamada. Se outra chamada
	// já renovou enquanto esta estava no ar, reaproveita o token novo.
	if (response.status === 401 && sentToken && !skipAuthRefresh) {
		const freshToken = authToken && authToken !== sentToken ? authToken : await refreshOnce();
		if (freshToken) response = await send(freshToken);
	}

	if (!response.ok) {
		const {message, details} = await readErrorBody(response);
		throw new ApiError(
			message ?? `A API retornou o status ${response.status}.`,
			errorKindForStatus(response.status),
			response.status,
			details,
		);
	}

	if (response.status === 204) return undefined as T;

	try {
		return (await response.json()) as T;
	} catch {
		throw new ApiError(
			"Não foi possível interpretar a resposta da API.",
			"server",
			response.status,
		);
	}
}

export const apiClient = {
	get: <T>(path: string, options?: ApiRequestOptions) =>
		request<T>(path, {...options, method: "GET"}),
	post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
		request<T>(path, {...options, method: "POST", body}),
	put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
		request<T>(path, {...options, method: "PUT", body}),
	patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
		request<T>(path, {...options, method: "PATCH", body}),
	delete: <T>(path: string, options?: ApiRequestOptions) =>
		request<T>(path, {...options, method: "DELETE"}),
};
