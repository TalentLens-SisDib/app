import assert from "node:assert/strict";
import type {CompetencyEvidence} from "../src/types/competencyEvidence.ts";
import {groupCompetencyEvidence} from "../src/utils/competencyEvidence.ts";

const evidence: CompetencyEvidence[] = [
	{
		id: "e-2",
		competencyId: "communication",
		competencyName: "Comunicação",
		sourceType: "entrevista",
		sourceLabel: "Entrevista técnica",
		excerpt: "  Conduziu uma retrospectiva semanal.  ",
		createdAt: "2026-11-02T10:00:00.000Z",
	},
	{
		id: "e-1",
		competencyId: "communication",
		competencyName: "Comunicação",
		sourceType: "curriculo",
		sourceLabel: "Currículo",
		excerpt: "Apresentou os resultados trimestrais para clientes.",
		createdAt: "2026-10-02T10:00:00.000Z",
	},
	{
		id: "e-3",
		competencyId: "problem-solving",
		competencyName: "Resolução de problemas",
		sourceType: "avaliacao",
		sourceLabel: "Avaliação técnica",
		excerpt: "   ",
	},
];

const groups = groupCompetencyEvidence(evidence);
assert.deepEqual(groups.map(({competencyName}) => competencyName), ["Comunicação"]);
assert.deepEqual(groups[0]?.evidence.map(({id}) => id), ["e-2", "e-1"]);
assert.equal(groups[0]?.evidence[0]?.excerpt.trim(), "Conduziu uma retrospectiva semanal.");
assert.deepEqual(groupCompetencyEvidence([]), []);

console.log("Competency evidence self-check passed (grouping, ordering, whitespace filtering, and empty state).");
