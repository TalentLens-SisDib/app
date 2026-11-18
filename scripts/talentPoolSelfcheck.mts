import assert from "node:assert/strict";
import type {TalentPoolEntry} from "../src/types/talentPool.ts";
import {filterTalentPool, TALENT_POOL_NOTE_MAX, validateTalentPoolNote} from "../src/utils/talentPool.ts";

// Nota: opcional, sem espaços nas pontas, vazia vira null, com limite.
assert.deepEqual(validateTalentPoolNote("   "), {ok: true, note: null});
assert.deepEqual(validateTalentPoolNote("  Ótima comunicação "), {ok: true, note: "Ótima comunicação"});
assert.equal(validateTalentPoolNote("a".repeat(TALENT_POOL_NOTE_MAX)).ok, true);
assert.equal(validateTalentPoolNote("a".repeat(TALENT_POOL_NOTE_MAX + 1)).ok, false);

const entry = (name: string, note: string | null, skills: string[], fits: string[] = []): TalentPoolEntry => ({
	profileId: name,
	note,
	addedAt: "2026-11-01T00:00:00.000Z",
	updatedAt: "2026-11-01T00:00:00.000Z",
	addedBy: null,
	profile: {
		id: name,
		name,
		description: null,
		skills: skills.map((skillName) => ({skillId: skillName, skillName})),
		culturalFits: fits.map((culturalFitName) => ({culturalFitId: culturalFitName, culturalFitName})),
	},
});

const pool = [
	entry("Ana Paula", "Boa para vagas de liderança", ["React", "TypeScript"]),
	entry("João Silva", null, ["Node.js"], ["Comunicação"]),
	entry("Márcia Lopes", "Ficou em 2º lugar na vaga de backend", ["Node.js", "PostgreSQL"]),
];
const names = (search: string) => filterTalentPool(pool, search).map((item) => item.profile.name);

// Busca vazia devolve tudo, na mesma ordem.
assert.deepEqual(names("  "), ["Ana Paula", "João Silva", "Márcia Lopes"]);
// Nome, sem acento e sem diferenciar maiúsculas.
assert.deepEqual(names("marcia"), ["Márcia Lopes"]);
assert.deepEqual(names("JOAO"), ["João Silva"]);
// Competência, característica e nota.
assert.deepEqual(names("node"), ["João Silva", "Márcia Lopes"]);
assert.deepEqual(names("comunicacao"), ["João Silva"]);
assert.deepEqual(names("liderança"), ["Ana Paula"]);
// Todos os termos precisam casar (em campos diferentes, inclusive).
assert.deepEqual(names("node backend"), ["Márcia Lopes"]);
assert.deepEqual(names("react backend"), []);

console.log("talentPool: ok");
