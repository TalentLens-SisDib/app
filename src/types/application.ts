/** Situação do candidato no processo seletivo da vaga. */
export type ApplicationStatus = "InProgress" | "Hired" | "Rejected";

/** Resumo da etapa em que o candidato está. */
export type ApplicationStep = {
	id: string;
	name: string;
	order: number;
};

/**
 * Candidatura: vínculo entre um perfil de candidato e uma vaga
 * (`JobApplication` na API).
 */
export type JobApplication = {
	profileId: string;
	profileName: string;
	jobOpeningId: string;
	appliedAt: string;
	/** `null` = ainda não entrou na primeira etapa (ou a etapa foi excluída). */
	currentStep: ApplicationStep | null;
	status: ApplicationStatus;
	/** Última mudança de etapa ou de status. */
	stageUpdatedAt: string;
};

/**
 * Formato bruto da API. Etapa e status são opcionais porque o backend da
 * mudança de etapa (#59) ainda não foi publicado — a resposta antiga não traz
 * esses campos e é normalizada em `normalizeApplication`.
 */
export type JobApplicationResponse = Omit<
	JobApplication,
	"currentStep" | "status" | "stageUpdatedAt"
> &
	Partial<Pick<JobApplication, "currentStep" | "status" | "stageUpdatedAt">>;

export type CreateApplicationInput = {
	profileId: string;
};

export type AdvanceApplicationInput = {
	/** Etapa que a tela mostrava; a API recusa (409) se o candidato já mudou. */
	fromStepId: string | null;
};

export type UpdateApplicationStatusInput = {
	status: ApplicationStatus;
};
