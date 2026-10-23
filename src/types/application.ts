/**
 * Candidatura: vínculo entre um perfil de candidato e uma vaga
 * (`JobApplication` no banco da API).
 */
export type JobApplication = {
	profileId: string;
	profileName: string;
	jobOpeningId: string;
	appliedAt: string;
};

export type CreateApplicationInput = {
	profileId: string;
	/** Só o mock usa — a API real resolve o nome pelo `profileId`. */
	profileName: string;
};
