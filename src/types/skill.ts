/** Competência cadastrada na API (`Skill`). */
export type Skill = {
	id: string;
	name: string;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
};

export type CreateSkillInput = {
	name: string;
	description?: string;
};

export type UpdateSkillInput = Partial<CreateSkillInput>;
