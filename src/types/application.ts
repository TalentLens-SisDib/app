/**
 * Candidatura: vínculo entre um perfil de candidato e uma vaga
 * (`JobApplication` na API).
 */
export type ApplicationStatus = "InProgress" | "Hired" | "Rejected";

/** Motivo do encerramento da avaliação (só com `status: "Rejected"`). */
export type ClosureReason =
	| "TechnicalMismatch"
	| "BehavioralMismatch"
	| "CandidateWithdrew"
	| "OfferDeclined"
	| "PositionFilled"
	| "Other";

export type ApplicationClosure = {
	reason: ClosureReason;
	notes: string | null;
	closedAt: string;
	closedBy: {id: number; name: string} | null;
};

export type ClosureInput = {
	reason: ClosureReason;
	/** Obrigatório quando `reason` é `"Other"`. */
	notes?: string;
};

export type ApplicationStep = {
	id: string;
	name: string;
	order: number;
};

export type CandidatePriorityScore = {
	requiredSkills: number;
	requiredBehavioral: number;
	desiredSkills: number;
	desiredBehavioral: number;
};

export type JobApplication = {
	profileId: string;
	profileName: string;
	jobOpeningId: string;
	appliedAt: string;
	currentStep: ApplicationStep | null;
	status: ApplicationStatus;
	stageUpdatedAt: string;
	/** Preenchido enquanto a candidatura está encerrada (`Rejected`); `null` nos demais casos. */
	closure: ApplicationClosure | null;
	priority?: number | null;
	priorityScore?: CandidatePriorityScore;
};

export type JobApplicationResponse = Omit<JobApplication, "currentStep" | "status" | "stageUpdatedAt" | "closure"> &
	Partial<Pick<JobApplication, "currentStep" | "status" | "stageUpdatedAt" | "closure">>;

export type CreateApplicationInput = {
	profileId: string;
};

export type UpdateApplicationStatusInput =
	| {status: "Rejected"; closure: ClosureInput}
	| {status: "InProgress" | "Hired"};
