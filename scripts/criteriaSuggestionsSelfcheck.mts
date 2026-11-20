import assert from "node:assert/strict";
import {ApiError} from "../src/api/errors.ts";
import {
	isExistingJobCriterion,
	parseJobCriterionSuggestions,
	prepareJobCriterionSuggestions,
} from "../src/utils/jobCriterionSuggestions.ts";

const parsed = parseJobCriterionSuggestions({
	suggestions: [
		{name: "  Comunicação clara  ", description: "  Explica decisões com objetividade.  "},
		{name: "Planejamento", description: ""},
	],
});
assert.deepEqual(parsed, [
	{name: "Comunicação clara", description: "Explica decisões com objetividade."},
	{name: "Planejamento", description: ""},
]);

assert.throws(() => parseJobCriterionSuggestions({items: []}), ApiError);
assert.throws(() => parseJobCriterionSuggestions({suggestions: [{name: "  "}]}), ApiError);

let id = 0;
const editable = prepareJobCriterionSuggestions(
	[
		...parsed,
		{name: " comunicação CLARA ", description: "Duplicada da primeira."},
		{name: "Colaboração", description: "Ajuda a equipe a alcançar resultados."},
	],
	["PLANEJAMENTO"],
	() => `suggestion-${++id}`,
);
assert.deepEqual(editable, [
	{
		id: "suggestion-1",
		name: "Comunicação clara",
		description: "Explica decisões com objetividade.",
		selected: false,
	},
	{
		id: "suggestion-2",
		name: "Colaboração",
		description: "Ajuda a equipe a alcançar resultados.",
		selected: false,
	},
]);
assert.equal(isExistingJobCriterion(" comunicaÇÃO CLARA ", ["Comunicação clara"]), true);
assert.equal(isExistingJobCriterion("COLABORAÇÃO", ["Colaboração"]), true);
assert.deepEqual(prepareJobCriterionSuggestions([], [], () => "unused"), []);

console.log("Criteria suggestions self-check passed (response validation, normalization, duplicate filtering, and opt-in selection).");
