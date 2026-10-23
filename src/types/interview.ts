/**
 * Registro de entrevista de uma etapa (`Interview` na API). Pertence ao
 * usuário que o criou — cada usuário tem no máximo um registro por etapa.
 */
export type Interview = {
	id: string;
	transcript: string;
	keyTakeaways: string[];
	userId: number;
	stepId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateInterviewInput = {
	transcript: string;
	keyTakeaways?: string[];
};

export type UpdateInterviewInput = Partial<CreateInterviewInput>;
