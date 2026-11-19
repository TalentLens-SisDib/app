import {ApiError} from "../api/errors.ts";
import {CRITERION_DESCRIPTION_MAX_LENGTH, CRITERION_NAME_MAX_LENGTH} from "../api/services/jobCriteria.ts";
import type {EditableJobCriterionSuggestion, JobCriterionSuggestion} from "../types/jobCriterionSuggestion.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Valida e normaliza o envelope retornado pelo endpoint de sugestões. */
export function parseJobCriterionSuggestions(value: unknown): JobCriterionSuggestion[] {
	if (!isRecord(value) || !Array.isArray(value.suggestions)) {
		throw new ApiError("A API retornou sugestões de critérios em um formato inválido.", "server");
	}

	return value.suggestions.map((item, index) => {
		if (!isRecord(item) || typeof item.name !== "string") {
			throw new ApiError(`A sugestão ${index + 1} não contém um nome válido.`, "server");
		}

		const name = item.name.trim();
		const description = typeof item.description === "string" ? item.description.trim() : "";
		if (!name || name.length > CRITERION_NAME_MAX_LENGTH) {
			throw new ApiError(`O nome da sugestão ${index + 1} é inválido.`, "server");
		}
		if (description.length > CRITERION_DESCRIPTION_MAX_LENGTH) {
			throw new ApiError(`A descrição da sugestão ${index + 1} é muito longa.`, "server");
		}

		return {name, description};
	});
}

function nameKey(name: string): string {
	return name.trim().toLocaleLowerCase("pt-BR");
}

/** Remove sugestões duplicadas ou já cadastradas e deixa todas sem seleção inicial. */
export function prepareJobCriterionSuggestions(
	suggestions: JobCriterionSuggestion[],
	existingNames: string[],
	createId: () => string,
): EditableJobCriterionSuggestion[] {
	const seen = new Set(existingNames.map(nameKey));
	const prepared: EditableJobCriterionSuggestion[] = [];
	for (const suggestion of suggestions) {
		const name = suggestion.name.trim();
		const key = nameKey(name);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		prepared.push({
			id: createId(),
			name,
			description: suggestion.description.trim(),
			selected: false,
		});
	}
	return prepared;
}

export function isExistingJobCriterion(name: string, existingNames: string[]): boolean {
	const key = nameKey(name);
	return Boolean(key) && existingNames.some((existingName) => nameKey(existingName) === key);
}
