import type {ApplicationStatus, JobApplication} from "../types/application";
import type {Step} from "../types/step";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
	InProgress: "Em andamento",
	Hired: "Aprovado",
	Rejected: "Reprovado",
};

export type StageAction =
	| {kind: "advance"; from: Step | null; to: Step}
	| {kind: "hire"; at: Step}
	| {kind: "reject"}
	| {kind: "reopen"};

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
		position: index + 1,
		total: ordered.length,
		primary,
		secondary: application.status === "InProgress" ? {kind: "reject" as const} : {kind: "reopen" as const},
	};
}
