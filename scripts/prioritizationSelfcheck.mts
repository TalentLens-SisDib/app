import assert from "node:assert/strict";
import type {JobApplication} from "../src/types/application.ts";
import type {JobOpening} from "../src/types/jobOpening.ts";
import type {Profile} from "../src/types/profile.ts";
import {prioritizeCandidates} from "../src/utils/candidatePrioritization.ts";

const job: JobOpening = {
	id: "job-a",
	name: "Engenheira de software",
	description: "",
	expectedWage: 0,
	companyId: 1,
	userId: 1,
	skills: [
		{skillId: "required", skillName: "TypeScript", isRequired: true},
		{skillId: "desired", skillName: "React", isRequired: false},
	],
	culturalFits: [
		{culturalFitId: "required-fit", culturalFitName: "Comunicação", isRequired: true},
		{culturalFitId: "desired-fit", culturalFitName: "Autonomia", isRequired: false},
	],
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

function profile(
	id: string,
	skillIds: string[],
	fitIds: string[] = [],
): Profile {
	return {
		id,
		name: id,
		skills: skillIds.map((skillId) => ({skillId, skillName: skillId})),
		culturalFits: fitIds.map((culturalFitId) => ({culturalFitId, culturalFitName: culturalFitId})),
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
	};
}

function application(profileId: string, appliedAt: string): JobApplication {
	return {profileId, profileName: profileId, jobOpeningId: job.id, appliedAt};
}

const profiles = [
	profile("required-both-later", ["required"], ["required-fit"]),
	profile("required-technical", ["required"], []),
	profile("required-behavioral", [], ["required-fit"]),
	profile("desired-technical", ["desired"], []),
	profile("desired-behavioral", [], ["desired-fit"]),
	profile("required-both-earlier", ["required"], ["required-fit"]),
];
const applications = [
	application("desired-technical", "2026-11-03T10:00:00.000Z"),
	application("required-behavioral", "2026-11-02T10:00:00.000Z"),
	application("required-technical", "2026-11-01T10:00:00.000Z"),
	application("required-both-earlier", "2026-11-04T10:00:00.000Z"),
	application("required-both-later", "2026-11-05T10:00:00.000Z"),
	application("desired-behavioral", "2026-11-06T10:00:00.000Z"),
];

const result = prioritizeCandidates(job, applications, profiles);
assert.equal(result.hasCriteria, true);
assert.deepEqual(
	result.rows.map(({application: item}) => item.profileId),
	["required-both-later", "required-both-earlier", "required-technical", "required-behavioral", "desired-technical", "desired-behavioral"],
	"required criteria must outrank desired matches, then ties use the most recent application",
);
assert.equal(result.rows[0]?.priority, 1);
assert.equal(result.rows[1]?.priority, 1, "equal criterion scores share a priority despite the date tie-break");
assert.equal(result.rows[2]?.priority, 3);
assert.equal(result.rows[3]?.priority, 4);
assert.equal(result.rows[4]?.priority, 5);
assert.equal(result.rows[5]?.priority, 6);

const missingProfile = prioritizeCandidates(
	{...job, skills: [{skillId: "required", skillName: "TypeScript", isRequired: true}], culturalFits: []},
	[application("unavailable", "2026-11-06T10:00:00.000Z"), application("known-zero", "2026-11-01T10:00:00.000Z")],
	[profile("known-zero", [])],
);
assert.deepEqual(missingProfile.rows.map(({application: item}) => item.profileId), ["known-zero", "unavailable"]);
assert.equal(missingProfile.rows[0]?.priority, missingProfile.rows[1]?.priority);

const noCriteria = prioritizeCandidates(
	{...job, skills: [], culturalFits: []},
	[application("older", "2026-11-01T10:00:00.000Z"), application("newer", "2026-11-06T10:00:00.000Z")],
	[],
);
assert.equal(noCriteria.hasCriteria, false);
assert.deepEqual(noCriteria.rows.map(({application: item}) => item.profileId), ["newer", "older"]);
assert.deepEqual(noCriteria.rows.map(({priority}) => priority), [null, null]);

console.log("Prioritization self-check passed (required/desired order, behavioral criteria, shared ranks, tie-breaks, missing profiles, and no-criteria state).");
