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

export type ApplicationStage = {
	/** Etapa atual, já cruzada com as etapas carregadas da vaga. */
	current: Step | null;
	/** Posição 1-based da etapa atual entre as etapas da vaga; 0 = não iniciado. */
	position: number;
	total: number;
	isLastStep: boolean;
	/** Ação principal (botão em destaque), se houver. */
	primary: StageAction | null;
	/** Ação secundária (reprovar / reabrir), se houver. */
	secondary: StageAction | null;
};

function byOrder(a: Step, b: Step): number {
	return a.order - b.order;
}

/**
 * Mesma regra que a API aplica: avança uma etapa por vez pela `order`;
 * aprovar só na última; reprovar a qualquer momento em andamento; reabrir
 * mantém a etapa em que o candidato estava.
 */
export function applicationStage(application: JobApplication, steps: Step[]): ApplicationStage {
	const ordered = [...steps].sort(byOrder);
	const currentId = application.currentStep?.id ?? null;
	const index = currentId === null ? -1 : ordered.findIndex((step) => step.id === currentId);
	const current = index >= 0 ? ordered[index] : null;
	const next = ordered[index + 1] ?? null;
	const isLastStep = current !== null && next === null;

	const inProgress = application.status === "InProgress";
	let primary: StageAction | null = null;
	if (inProgress && next) primary = {kind: "advance", from: current, to: next};
	else if (inProgress && current) primary = {kind: "hire", at: current};
	const secondary: StageAction = inProgress ? {kind: "reject"} : {kind: "reopen"};

	return {
		current,
		position: index + 1,
		total: ordered.length,
		isLastStep,
		primary,
		secondary,
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
