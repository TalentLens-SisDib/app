import type {TalentPoolEntry} from "../types/talentPool";

/** Mesmo limite que a API valida. */
export const TALENT_POOL_NOTE_MAX = 1000;

/** Nota pronta para a API (`null` quando vazia) ou a mensagem de erro do campo. */
export function validateTalentPoolNote(value: string): {ok: true; note: string | null} | {ok: false; error: string} {
	const note = value.trim();
	if (note.length > TALENT_POOL_NOTE_MAX) {
		return {ok: false, error: `Use no máximo ${TALENT_POOL_NOTE_MAX} caracteres.`};
	}
	return {ok: true, note: note || null};
}

function normalize(value: string): string {
	return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Busca por nome, competência, característica comportamental ou nota,
 * sem diferenciar acentos e maiúsculas. Todos os termos precisam casar.
 */
export function filterTalentPool(entries: TalentPoolEntry[], search: string): TalentPoolEntry[] {
	const terms = normalize(search).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return entries;

	return entries.filter((entry) => {
		const haystack = normalize(
			[
				entry.profile.name,
				entry.note ?? "",
				...entry.profile.skills.map((skill) => skill.skillName),
				...entry.profile.culturalFits.map((fit) => fit.culturalFitName),
			].join(" "),
		);
		return terms.every((term) => haystack.includes(term));
	});
}
