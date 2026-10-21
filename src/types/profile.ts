/** Competência vinculada a um perfil, como a API a devolve. */
export type ProfileSkill = {
	skillId: string;
	skillName: string;
};

/** Perfil de candidato (`ApplicantProfile` na API). */
export type Profile = {
	id: string;
	name: string;
	description?: string | null;
	skills?: ProfileSkill[];
	createdAt: string;
	updatedAt: string;
};
