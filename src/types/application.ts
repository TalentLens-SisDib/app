/**
 * Candidatura: vínculo entre um perfil de candidato e uma vaga
 * (`JobApplication` na API).
 */
export type JobApplication = {
	profileId: string;
	profileName: string;
	jobOpeningId: string;
	appliedAt: string;
};

export type CreateApplicationInput = {
	profileId: string;
};
