import type {JobOpening} from "../types/jobOpening";
import type {Profile} from "../types/profile";

export type BehavioralCriterionMatch = {
	id: string;
	name: string;
	isRequired: boolean;
	/** null indica que o perfil do candidato não foi carregado. */
	matched: boolean | null;
};

export type BehavioralMatch = {
	criteria: BehavioralCriterionMatch[];
	requiredTotal: number;
	requiredMatched: number;
	desiredTotal: number;
	desiredMatched: number;
};

/** Compara as características registradas no perfil com os critérios da vaga. */
export function matchBehavioralCriteria(
	jobOpening: JobOpening,
	profile: Profile | undefined,
): BehavioralMatch {
	const profileFitIds = new Set((profile?.culturalFits ?? []).map((fit) => fit.culturalFitId));
	const criteria = [...(jobOpening.culturalFits ?? [])]
		.sort((a, b) => Number(b.isRequired) - Number(a.isRequired))
		.map((criterion) => ({
			id: criterion.culturalFitId,
			name: criterion.culturalFitName,
			isRequired: criterion.isRequired,
			matched: profile ? profileFitIds.has(criterion.culturalFitId) : null,
		}));
	const required = criteria.filter((criterion) => criterion.isRequired);
	const desired = criteria.filter((criterion) => !criterion.isRequired);

	return {
		criteria,
		requiredTotal: required.length,
		requiredMatched: required.filter((criterion) => criterion.matched === true).length,
		desiredTotal: desired.length,
		desiredMatched: desired.filter((criterion) => criterion.matched === true).length,
	};
}
