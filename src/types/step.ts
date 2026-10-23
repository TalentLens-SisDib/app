/** Etapa do processo seletivo de uma vaga (`Step` na API). */
export type Step = {
	id: string;
	name: string;
	description?: string | null;
	order: number;
	jobOpeningId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateStepInput = {
	name: string;
	description?: string;
	order: number;
};

export type UpdateStepInput = Partial<CreateStepInput>;
