import type {CompetencyEvidence} from "./competencyEvidence";
import type {ApplicationClosure} from "./application";

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

/** Vínculo do perfil com uma vaga, como vem embutido em `GET /profiles`. */
export type ProfileApplication = {
	profileId: string;
	jobOpeningId: string;
	appliedAt: string;
	closure?: ApplicationClosure | null;
};

/** Payload de `POST /profiles` para cadastrar um candidato manualmente. */
export type CreateProfileInput = {
	name: string;
	description?: string;
	skills?: string[];
	culturalFits?: string[];
	educationalBackground?: ProfileEducationInput[];
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
	/** Evidências avaliadas por competência, disponíveis após a implementação da API. */
	competencyEvidence?: CompetencyEvidence[];
	applications?: ProfileApplication[];
	/** Empresa dona do cadastro; a API só devolve candidatos da empresa de quem está logado. */
	companyId?: number;
	/** Recrutador que cadastrou o candidato; `null` em cadastros anteriores a esse registro. */
	createdBy?: {id: number; name: string} | null;
	/** Avisos de consistência gerados apenas durante a importação do currículo. */
	qualityIssues?: string[];
	createdAt: string;
	updatedAt: string;
};
