import assert from "node:assert/strict";
import type {JobApplication} from "../src/types/application.ts";
import type {Step} from "../src/types/step.ts";
import {applicationStage, countByStep} from "../src/utils/applicationStage.ts";

const step = (id: string, order: number): Step =>
	({id, name: id, order, jobOpeningId: "job", createdAt: "", updatedAt: ""});

// Fora de ordem e com lacuna na `order`, como pode vir da API.
const steps = [step("proposta", 5), step("triagem", 1), step("entrevista", 2)];

const app = (current: string | null, status: JobApplication["status"] = "InProgress"): JobApplication => ({
	profileId: `p-${current}-${status}`,
	profileName: "Ana",
	jobOpeningId: "job",
	appliedAt: "2026-11-01T00:00:00.000Z",
	stageUpdatedAt: "2026-11-01T00:00:00.000Z",
	status,
	currentStep: current ? {id: current, name: current, order: 0} : null,
});

// Não iniciado → primeira etapa pela order.
let stage = applicationStage(app(null), steps);
assert.equal(stage.position, 0);
assert.equal(stage.total, 3);
assert.deepEqual(stage.primary, {kind: "advance", from: null, to: steps[1]});
assert.deepEqual(stage.secondary, {kind: "reject"});

// Etapa do meio → próxima, pulando a lacuna de order.
stage = applicationStage(app("entrevista"), steps);
assert.equal(stage.position, 2);
assert.deepEqual(stage.primary, {kind: "advance", from: steps[2], to: steps[0]});

// Última etapa → aprovar.
stage = applicationStage(app("proposta"), steps);
assert.equal(stage.isLastStep, true);
assert.deepEqual(stage.primary, {kind: "hire", at: steps[0]});

// Encerrado → só reabrir.
for (const status of ["Hired", "Rejected"] as const) {
	stage = applicationStage(app("proposta", status), steps);
	assert.equal(stage.primary, null);
	assert.deepEqual(stage.secondary, {kind: "reopen"});
}

// Vaga sem etapas: nada a encaminhar, ainda dá para reprovar.
stage = applicationStage(app(null), []);
assert.equal(stage.primary, null);
assert.deepEqual(stage.secondary, {kind: "reject"});

// Etapa atual que não existe mais na vaga conta como não iniciado.
stage = applicationStage(app("removida"), steps);
assert.equal(stage.current, null);
assert.deepEqual(stage.primary, {kind: "advance", from: null, to: steps[1]});

// Contagem por etapa ignora encerrados.
const counts = countByStep([app(null), app("triagem"), app("triagem"), app("triagem", "Rejected")]);
assert.equal(counts.get(null), 1);
assert.equal(counts.get("triagem"), 2);

console.log("applicationStage: ok");
