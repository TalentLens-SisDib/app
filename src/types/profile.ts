/** Competência vinculada a um perfil, como a API a devolve. */
export type ProfileSkill = {
	skillId: string;
	skillName: string;
};

export type ProfileCulturalFit = {
	culturalFitId: string;
	culturalFitName: string;
};

export type ProfileEducation = {
	id: string;
	institution: string;
	degree: string;
	startDate: string;
	endDate: string | null;
	profileId: string;
};

export type ProfileEducationInput = {
	institution: string;
	degree: string;
	startDate: string;
	endDate?: string | null;
};

/** Registro de entrevista associado ao perfil; a API serializa os pontos-chave como JSON. */
export type ProfileInterview = {
	id: string;
	interviewId: string;
	profileId: string;
	transcript: string;
	keyTakeaways: string;
	startDate: string;
	createdAt: string;
	updatedAt: string;
};

export type UpdateProfileInput = {
	name?: string;
	description?: string;
	skills?: string[];
	culturalFits?: string[];
	educationalBackground?: ProfileEducationInput[];
};

/** Perfil de candidato (`ApplicantProfile` na API). */
export type Profile = {
	id: string;
	name: string;
	description?: string | null;
	skills?: ProfileSkill[];
	culturalFits?: ProfileCulturalFit[];
	educationalBackground?: ProfileEducation[];
	profileInterviews?: ProfileInterview[];
	/** Avisos de consistência gerados apenas durante a importação do currículo. */
	qualityIssues?: string[];
	createdAt: string;
	updatedAt: string;
};
