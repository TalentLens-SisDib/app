/**
 * Registro de entrevista de um candidato numa etapa, como o app o usa.
 *
 * Na API são dois recursos: a entrevista (`Interview`: um usuário numa etapa,
 * `POST /steps/{stepId}/interviews`) e, dentro dela, o registro de cada candidato
 * (`ProfileInterview`, `POST /profiles/{id}/add-interview`). O app cria uma
 * entrevista por registro, então trata os dois como um item só.
 */
export type Interview = {
	/** Id do `ProfileInterview`. */
	id: string;
	/** Id da `Interview` que contém o registro. */
	interviewId: string;
	stepId: string;
	/** Autor (dono da `Interview`). */
	userId: number;
	/** Candidato entrevistado. */
	profileId: string;
	transcript: string;
	keyTakeaways: string[];
	/** Quando a entrevista aconteceu (ISO). */
	startDate: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateInterviewInput = {
	profileId: string;
	transcript: string;
	keyTakeaways?: string[];
	/** ISO; a API usa a data atual se ausente. */
	startDate?: string;
};

/** O candidato de um registro não muda depois de criado. */
export type UpdateInterviewInput = Partial<Omit<CreateInterviewInput, "profileId">>;
