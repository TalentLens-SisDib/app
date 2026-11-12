import type {ApplicationStatus, JobApplication} from "../types/application";
import type {Step} from "../types/step";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
	InProgress: "Em andamento",
	Hired: "Aprovado",
	Rejected: "Reprovado",
};

/** O que o recrutador pode fazer a seguir com o candidato. */
export type StageAction =
	| {kind: "advance"; from: Step | null; to: Step}
	| {kind: "hire"; at: Step}
	| {kind: "reject"}
	| {kind: "reopen"};

/**
 * Mesma regra que a API aplica: avança uma etapa por vez pela `order`;
 * aprovar só na última; reprovar a qualquer momento em andamento; reabrir
 * mantém a etapa em que o candidato estava.
 */
export function applicationStage(application: JobApplication, steps: Step[]) {
	const ordered = [...steps].sort((a, b) => a.order - b.order);
	const currentId = application.currentStep?.id ?? null;
	const index = currentId === null ? -1 : ordered.findIndex((step) => step.id === currentId);
	const current = index >= 0 ? ordered[index] : null;
	const next = ordered[index + 1] ?? null;
	const primary = application.status !== "InProgress"
		? null
		: next
			? {kind: "advance" as const, from: current, to: next}
			: current
				? {kind: "hire" as const, at: current}
				: null;

	return {
		current,
		/** Posição 1-based da etapa atual; 0 = não iniciado. */
		position: index + 1,
		total: ordered.length,
		isLastStep: current !== null && next === null,
		primary,
		secondary: application.status === "InProgress" ? {kind: "reject" as const} : {kind: "reopen" as const},
	};
}

/** Quantos candidatos em andamento estão em cada etapa (chave `null` = não iniciado). */
export function countByStep(applications: JobApplication[]): Map<string | null, number> {
	const counts = new Map<string | null, number>();
	for (const application of applications) {
		if (application.status !== "InProgress") continue;
		const key = application.currentStep?.id ?? null;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return counts;
}
