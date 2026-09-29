export type ApiErrorKind =
	| "network"
	| "validation"
	| "unauthorized"
	| "not_found"
	| "server"
	| "unknown";

/**
 * Erro padronizado da camada de API. A UI decide como apresentar cada
 * `kind` (toast, mensagem de campo, redirecionamento de login, etc.) —
 * esta classe não sabe nada sobre componentes visuais.
 */
export class ApiError extends Error {
	readonly kind: ApiErrorKind;
	readonly status?: number;
	readonly details?: unknown;

	constructor(message: string, kind: ApiErrorKind, status?: number, details?: unknown) {
		super(message);
		this.name = "ApiError";
		this.kind = kind;
		this.status = status;
		this.details = details;
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

export function errorKindForStatus(status: number): ApiErrorKind {
	if (status === 401 || status === 403) return "unauthorized";
	if (status === 404) return "not_found";
	if (status === 400 || status === 422) return "validation";
	if (status >= 500) return "server";
	return "unknown";
}
