/**
 * Candidatura: vínculo entre um perfil de candidato e uma vaga
 * (`JobApplication` na API).
 */
export type ApplicationStatus = "InProgress" | "Hired" | "Rejected";

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
	priority?: number | null;
	priorityScore?: CandidatePriorityScore;
};

export type JobApplicationResponse = Omit<JobApplication, "currentStep" | "status" | "stageUpdatedAt"> &
	Partial<Pick<JobApplication, "currentStep" | "status" | "stageUpdatedAt">>;

export type CreateApplicationInput = {
	profileId: string;
};

export type UpdateApplicationStatusInput = {
	status: ApplicationStatus;
};
