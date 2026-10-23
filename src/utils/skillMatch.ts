import type {JobOpening} from "../types/jobOpening";
import type {Profile} from "../types/profile";

export type SkillMatch = {
	requiredTotal: number;
	requiredMatched: number;
	desiredTotal: number;
	desiredMatched: number;
	/** Nomes das competências da vaga que o candidato tem (obrigatórias primeiro). */
	matchedNames: string[];
	/** Obrigatórias que faltam no perfil. */
	missingRequired: string[];
};

/** Cruza as competências do perfil com as da vaga, pelo id da competência. */
export function matchSkills(jobOpening: JobOpening, profile: Profile | undefined): SkillMatch {
	const profileSkillIds = new Set((profile?.skills ?? []).map((skill) => skill.skillId));
	const jobSkills = [...(jobOpening.skills ?? [])].sort(
		(a, b) => Number(b.isRequired) - Number(a.isRequired),
	);
	const required = jobSkills.filter((skill) => skill.isRequired);
	const desired = jobSkills.filter((skill) => !skill.isRequired);

	return {
		requiredTotal: required.length,
		requiredMatched: required.filter((skill) => profileSkillIds.has(skill.skillId)).length,
		desiredTotal: desired.length,
		desiredMatched: desired.filter((skill) => profileSkillIds.has(skill.skillId)).length,
		matchedNames: jobSkills
			.filter((skill) => profileSkillIds.has(skill.skillId))
			.map((skill) => skill.skillName),
		missingRequired: required
			.filter((skill) => !profileSkillIds.has(skill.skillId))
			.map((skill) => skill.skillName),
	};
}

/** Ordenação por aderência: obrigatórias atendidas, depois desejáveis. */
export function compareMatch(a: SkillMatch, b: SkillMatch): number {
	return b.requiredMatched - a.requiredMatched || b.desiredMatched - a.desiredMatched;
}
