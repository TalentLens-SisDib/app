/** Competência vinculada a uma vaga, como a API a devolve. */
export type JobOpeningSkill = {
	skillId: string;
	skillName: string;
	isRequired: boolean;
};

/** Vaga (`JobOpening` na API). */
export type JobOpening = {
	id: string;
	name: string;
	description: string;
	/** `Decimal` no banco — a API serializa como string. */
	expectedWage: number | string;
	companyId: number;
	userId: number;
	skills?: JobOpeningSkill[];
	createdAt: string;
	updatedAt: string;
};

export type JobOpeningSkillInput = {
	skillId: string;
	isRequired: boolean;
};

export type CreateJobOpeningInput = {
	name: string;
	description: string;
	expectedWage: number;
	skills?: JobOpeningSkillInput[];
};

export type UpdateJobOpeningInput = Partial<CreateJobOpeningInput>;
