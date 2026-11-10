import type {JobApplication} from "../types/application";
import type {JobOpening} from "../types/jobOpening";
import type {Profile} from "../types/profile";
import {matchBehavioralCriteria, type BehavioralMatch} from "./behavioralMatch.ts";
import {matchSkills, type SkillMatch} from "./skillMatch.ts";

export type CandidatePriorityScore = {
	requiredSkills: number;
	requiredBehavioral: number;
	desiredSkills: number;
	desiredBehavioral: number;
};

export type PrioritizedCandidate = {
	application: JobApplication;
	profile: Profile | undefined;
	skillMatch: SkillMatch;
	behavioralMatch: BehavioralMatch;
	score: CandidatePriorityScore;
	priority: number | null;
};

export type CandidatePrioritization = {
	hasCriteria: boolean;
	rows: PrioritizedCandidate[];
};

/**
 * Orders candidates using only criteria currently available to the app:
 * required technical, required behavioral, desired technical, then desired
 * behavioral matches. Application date breaks ties; equal criterion scores
 * share the same priority number.
 */
export function prioritizeCandidates(
	jobOpening: JobOpening,
	applications: JobApplication[],
	profiles: Profile[],
): CandidatePrioritization {
	const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
	const hasCriteria = (jobOpening.skills?.length ?? 0) + (jobOpening.culturalFits?.length ?? 0) > 0;
	const rows = applications.map((application): PrioritizedCandidate => {
		const profile = profilesById.get(application.profileId);
		const skillMatch = matchSkills(jobOpening, profile);
		const behavioralMatch = matchBehavioralCriteria(jobOpening, profile);

		return {
			application,
			profile,
			skillMatch,
			behavioralMatch,
			score: {
				requiredSkills: skillMatch.requiredMatched,
				requiredBehavioral: behavioralMatch.requiredMatched,
				desiredSkills: skillMatch.desiredMatched,
				desiredBehavioral: behavioralMatch.desiredMatched,
			},
			priority: null,
		};
	});

	rows.sort((a, b) => {
		const scoreOrder = comparePriorityScores(a.score, b.score);
		if (scoreOrder !== 0) return scoreOrder;
		if (Boolean(a.profile) !== Boolean(b.profile)) return a.profile ? -1 : 1;
		return b.application.appliedAt.localeCompare(a.application.appliedAt);
	});

	if (!hasCriteria) return {hasCriteria, rows};

	let priority = 0;
	let previousScore: CandidatePriorityScore | undefined;
	for (const [index, row] of rows.entries()) {
		if (!previousScore || comparePriorityScores(row.score, previousScore) !== 0) {
			priority = index + 1;
		}
		row.priority = priority;
		previousScore = row.score;
	}

	return {hasCriteria, rows};
}

/** Returns a negative value when the first score should be shown first. */
export function comparePriorityScores(a: CandidatePriorityScore, b: CandidatePriorityScore): number {
	return (
		b.requiredSkills - a.requiredSkills ||
		b.requiredBehavioral - a.requiredBehavioral ||
		b.desiredSkills - a.desiredSkills ||
		b.desiredBehavioral - a.desiredBehavioral
	);
}
