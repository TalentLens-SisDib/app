import assert from "node:assert/strict";
import type {JobOpening} from "../src/types/jobOpening.ts";
import type {Profile} from "../src/types/profile.ts";
import {adaptationCriteria, adaptationUpdate, countMet, profileSelection} from "../src/utils/adaptation.ts";

const jobOpening = {
	id: "job-a",
	name: "Dev Front-end",
	skills: [
		{skillId: "s-css", skillName: "CSS", isRequired: false},
		{skillId: "s-react", skillName: "React", isRequired: true},
		{skillId: "s-ts", skillName: "TypeScript", isRequired: true},
	],
	culturalFits: [
		{culturalFitId: "c-com", culturalFitName: "Comunicação", isRequired: true},
		{culturalFitId: "c-auto", culturalFitName: "Autonomia", isRequired: false},
	],
} as JobOpening;

const profile = {
	id: "p1",
	name: "Ana",
	skills: [
		{skillId: "s-react", skillName: "React"},
		{skillId: "s-php", skillName: "PHP"},
	],
	culturalFits: [{culturalFitId: "c-lead", culturalFitName: "Liderança"}],
} as Profile;

const criteria = adaptationCriteria(jobOpening);
assert.deepEqual(criteria.technical.map(({name}) => name), ["React", "TypeScript", "CSS"]);
assert.deepEqual(criteria.behavioral.map(({name}) => name), ["Comunicação", "Autonomia"]);

const selection = profileSelection(profile);
assert.deepEqual(countMet(criteria.technical, selection.technical), {
	requiredTotal: 2,
	requiredMet: 1,
	desiredTotal: 1,
	desiredMet: 0,
});
assert.deepEqual(countMet(criteria.behavioral, selection.behavioral), {
	requiredTotal: 1,
	requiredMet: 0,
	desiredTotal: 1,
	desiredMet: 0,
});

// Marca TypeScript e Comunicação, desmarca React: o que está fora da vaga (PHP, Liderança) é preservado.
selection.technical.add("s-ts");
selection.technical.delete("s-react");
selection.behavioral.add("c-com");
assert.deepEqual(adaptationUpdate(profile, jobOpening, selection), {
	skills: ["PHP", "TypeScript"],
	culturalFits: ["Liderança", "Comunicação"],
});

// Sem alterações, o envio reproduz o perfil (mesmos itens).
assert.deepEqual(adaptationUpdate(profile, jobOpening, profileSelection(profile)), {
	skills: ["PHP", "React"],
	culturalFits: ["Liderança"],
});

// Vaga sem critérios não mexe no perfil.
assert.deepEqual(adaptationUpdate(profile, {...jobOpening, skills: [], culturalFits: []}, profileSelection(profile)), {
	skills: ["React", "PHP"],
	culturalFits: ["Liderança"],
});

console.log("adaptation self-check passed");
