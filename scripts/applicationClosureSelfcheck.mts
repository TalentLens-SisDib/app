import assert from "node:assert/strict";
import {
	CLOSURE_NOTES_MAX,
	CLOSURE_REASON_LABEL,
	CLOSURE_REASONS,
	validateClosureForm,
} from "../src/utils/applicationClosure.ts";

// Todo motivo do formulário tem rótulo, sem repetição.
assert.equal(new Set(CLOSURE_REASONS).size, CLOSURE_REASONS.length);
assert.deepEqual([...CLOSURE_REASONS].sort(), Object.keys(CLOSURE_REASON_LABEL).sort());

// Motivo é obrigatório.
let result = validateClosureForm({reason: "", notes: "qualquer"});
assert.equal(result.ok, false);
assert.ok(!result.ok && result.errors.reason);

// Observações são opcionais e não vão vazias para a API.
result = validateClosureForm({reason: "CandidateWithdrew", notes: "   "});
assert.deepEqual(result, {ok: true, closure: {reason: "CandidateWithdrew"}});

// Observações vão sem espaços nas pontas.
result = validateClosureForm({reason: "TechnicalMismatch", notes: "  Sem experiência com Node  "});
assert.deepEqual(result, {ok: true, closure: {reason: "TechnicalMismatch", notes: "Sem experiência com Node"}});

// "Outro motivo" exige observações.
result = validateClosureForm({reason: "Other", notes: " "});
assert.ok(!result.ok && result.errors.notes && !result.errors.reason);
result = validateClosureForm({reason: "Other", notes: "Mudou de cidade"});
assert.deepEqual(result, {ok: true, closure: {reason: "Other", notes: "Mudou de cidade"}});

// Limite de tamanho (após trim).
result = validateClosureForm({reason: "OfferDeclined", notes: "a".repeat(CLOSURE_NOTES_MAX)});
assert.equal(result.ok, true);
result = validateClosureForm({reason: "OfferDeclined", notes: "a".repeat(CLOSURE_NOTES_MAX + 1)});
assert.ok(!result.ok && result.errors.notes);

console.log("applicationClosure: ok");
