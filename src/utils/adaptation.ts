import type {JobOpening} from "../types/jobOpening";
import type {Profile, UpdateProfileInput} from "../types/profile";

export type AdaptationDimension = "technical" | "behavioral";

export type AdaptationCriterion = {
	id: string;
	name: string;
	isRequired: boolean;
};

/** Ids dos critérios da vaga marcados como atendidos, por eixo. */
export type AdaptationSelection = Record<AdaptationDimension, Set<string>>;

/** Competências (técnico) e fits culturais (comportamental) da vaga, obrigatórios primeiro. */
export function adaptationCriteria(jobOpening: JobOpening): Record<AdaptationDimension, AdaptationCriterion[]> {
	const byRequired = (a: AdaptationCriterion, b: AdaptationCriterion) => Number(b.isRequired) - Number(a.isRequired);
	return {
		technical: (jobOpening.skills ?? [])
			.map((skill) => ({id: skill.skillId, name: skill.skillName, isRequired: skill.isRequired}))
			.sort(byRequired),
		behavioral: (jobOpening.culturalFits ?? [])
			.map((fit) => ({id: fit.culturalFitId, name: fit.culturalFitName, isRequired: fit.isRequired}))
			.sort(byRequired),
	};
}

/** O que o perfil já atende da vaga: o registro persistido do acompanhamento. */
export function profileSelection(profile: Profile): AdaptationSelection {
	return {
		technical: new Set((profile.skills ?? []).map((skill) => skill.skillId)),
		behavioral: new Set((profile.culturalFits ?? []).map((fit) => fit.culturalFitId)),
	};
}

export function countMet(criteria: AdaptationCriterion[], selected: Set<string>) {
	const required = criteria.filter((criterion) => criterion.isRequired);
	const desired = criteria.filter((criterion) => !criterion.isRequired);
	return {
		requiredTotal: required.length,
		requiredMet: required.filter((criterion) => selected.has(criterion.id)).length,
		desiredTotal: desired.length,
		desiredMet: desired.filter((criterion) => selected.has(criterion.id)).length,
	};
}

/**
 * Listas para `PATCH /profiles/{id}`, que substitui competências e fits inteiros:
 * mantém o que o perfil tem fora da vaga e troca só os critérios da vaga.
 */
export function adaptationUpdate(
	profile: Profile,
	jobOpening: JobOpening,
	selection: AdaptationSelection,
): Required<Pick<UpdateProfileInput, "skills" | "culturalFits">> {
	const criteria = adaptationCriteria(jobOpening);
	const merge = (
		current: {id: string; name: string}[],
		jobCriteria: AdaptationCriterion[],
		selected: Set<string>,
	) => {
		const jobIds = new Set(jobCriteria.map((criterion) => criterion.id));
		const names = [
			...current.filter((item) => !jobIds.has(item.id)).map((item) => item.name),
			...jobCriteria.filter((criterion) => selected.has(criterion.id)).map((criterion) => criterion.name),
		];
		return [...new Set(names)];
	};
	return {
		skills: merge(
			(profile.skills ?? []).map((skill) => ({id: skill.skillId, name: skill.skillName})),
			criteria.technical,
			selection.technical,
		),
		culturalFits: merge(
			(profile.culturalFits ?? []).map((fit) => ({id: fit.culturalFitId, name: fit.culturalFitName})),
			criteria.behavioral,
			selection.behavioral,
		),
	};
}
