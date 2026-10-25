/** Critério de avaliação definido para uma vaga, salvo localmente no navegador. */
export type JobCriterion = {
	id: string;
	jobOpeningId: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
};

export type JobCriterionInput = {
	name: string;
	description?: string;
};
