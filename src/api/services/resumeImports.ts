import type {Profile} from "../../types/profile";
import type {
	ResumeFormat,
	ResumeImportResult,
	SelectedResume,
} from "../../types/resumeImport";
import {ApiError, isApiError} from "../errors";
import {uploadCv} from "./profiles";

// `POST /profiles/upload-cv` retorna o perfil final já persistido pela API.

export const MAX_FILES_PER_IMPORT = 50;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FORMATS: ResumeFormat[] = ["PDF"];
export const ACCEPTED_EXTENSIONS = ".pdf";

const outcomeMessage = {
	done: "Concluído",
	attention: "Alguns dados não foram identificados",
	failed: "Não foi possível processar o arquivo",
} as const;

const attentionHint =
	"O candidato foi criado com os dados que conseguimos identificar. Você pode completar o restante no perfil.";

const failureHint =
	"Nenhum candidato foi criado a partir deste arquivo. Corrija o problema e importe o currículo novamente.";

export type RejectedFile = {name: string; reason: string};

export type FileSelection = {
	accepted: SelectedResume[];
	rejected: RejectedFile[];
};

export type ImportProgressEvent = {
	file: SelectedResume;
	status: "processing" | "done" | "attention" | "failed";
	result: ResumeImportResult | null;
};

function formatOf(name: string): ResumeFormat | null {
	const extension = name.slice(name.lastIndexOf(".") + 1).toUpperCase();
	return (ACCEPTED_FORMATS as string[]).includes(extension)
		? (extension as ResumeFormat)
		: null;
}

/**
 * Converte a seleção do usuário (input de arquivo ou drag and drop),
 * separando o que pode ser importado do que foi recusado e por quê.
 */
export function selectResumeFiles(files: File[], alreadySelected: number): FileSelection {
	const accepted: SelectedResume[] = [];
	const rejected: RejectedFile[] = [];

	for (const file of files) {
		const format = formatOf(file.name);

		if (!format) {
			rejected.push({name: file.name, reason: "formato não aceito"});
			continue;
		}
		if (file.size > MAX_FILE_SIZE_BYTES) {
			rejected.push({name: file.name, reason: "maior que 5 MB"});
			continue;
		}
		if (alreadySelected + accepted.length >= MAX_FILES_PER_IMPORT) {
			rejected.push({name: file.name, reason: "limite de 50 arquivos atingido"});
			continue;
		}

		accepted.push({
			id: crypto.randomUUID(),
			name: file.name,
			size: file.size,
			format,
			source: file,
		});
	}

	return {accepted, rejected};
}

export function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

function hasText(value: string | null | undefined): boolean {
	return typeof value === "string" && value.trim().length > 0;
}

/** O que ficou faltando no perfil lido — vira a lista de pendências na tela. */
function pendingIssues(profile: Profile): string[] {
	const issues: string[] = [...(profile.qualityIssues ?? [])];
	if (!hasText(profile.description)) issues.push("Resumo profissional não identificado");
	if ((profile.skills?.length ?? 0) === 0) issues.push("Competências não identificadas");
	if ((profile.educationalBackground?.length ?? 0) === 0) {
		issues.push("Formação acadêmica não identificada; revise se aplicável");
	}
	return [...new Set(issues)];
}

function successResult(
	file: SelectedResume,
	profile: Profile,
): ResumeImportResult {
	const issues = pendingIssues(profile);

	const outcome = issues.length > 0 ? "attention" : "done";

	return {
		id: file.id,
		fileName: file.name,
		size: file.size,
		outcome,
		candidateName: profile.name,
		profileId: profile.id,
		message: outcomeMessage[outcome],
		issues,
		hint: outcome === "attention" ? attentionHint : "",
	};
}

function failedResult(file: SelectedResume, issue: string): ResumeImportResult {
	return {
		id: file.id,
		fileName: file.name,
		size: file.size,
		outcome: "failed",
		candidateName: null,
		profileId: null,
		message: outcomeMessage.failed,
		issues: [issue],
		hint: failureHint,
	};
}

/**
 * Erros que não são do arquivo, e sim da sessão ou da conexão: interrompem a
 * importação inteira em vez de marcar um currículo como falho.
 */
function isFatal(error: unknown): boolean {
	return isApiError(error) && (error.kind === "unauthorized" || error.kind === "network");
}

function issueFor(error: unknown): string {
	if (isApiError(error)) {
		if (error.kind === "validation") return error.message;
		return "A API não conseguiu ler este currículo";
	}
	return "Erro inesperado ao processar o arquivo";
}

/**
 * Importa os currículos selecionados, um a um, emitindo o andamento em
 * `onProgress`. Rejeita com `AbortError` se `signal` for abortado e com
 * `ApiError` quando a falha impede continuar (sessão expirada, API fora).
 */
export async function importResumes(
	files: SelectedResume[],
	onProgress: (event: ImportProgressEvent) => void,
	signal?: AbortSignal,
): Promise<ResumeImportResult[]> {
	if (files.length === 0) {
		throw new ApiError("Selecione ao menos um currículo.", "validation", 422);
	}

	const results: ResumeImportResult[] = [];

	for (const file of files) {
		if (signal?.aborted) throw new DOMException("Importação cancelada", "AbortError");

		onProgress({file, status: "processing", result: null});

		let result: ResumeImportResult;

		try {
			const created = await uploadCv(file.source, signal);
			result = successResult(file, created);
		} catch (error) {
			if (isAbortError(error) || isFatal(error)) throw error;
			result = failedResult(file, issueFor(error));
		}

		results.push(result);
		onProgress({file, status: result.outcome, result});
	}

	return results;
}
