import {ApiError, errorKindForStatus} from "./errors";

const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// Token de acesso mantido em memória. Único ponto de leitura/escrita —
// services nunca manipulam headers de autenticação diretamente.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
	authToken = token;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

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
	const {body, headers, ...rest} = options;

	let response: Response;
	try {
		response = await fetch(`${baseUrl}${path}`, {
			...rest,
			headers: {
				"Content-Type": "application/json",
				...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
				...headers,
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});
	} catch {
		throw new ApiError("Não foi possível conectar à API.", "network");
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
