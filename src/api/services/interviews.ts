import {apiClient} from "../client";
import type {
	CreateInterviewInput,
	Interview,
	UpdateInterviewInput,
} from "../../types/interview";

// Formatos da API (ver `types/interview.ts` para o modelo usado no app).
type ApiProfileInterview = {
	id: string;
	interviewId: string;
	profileId: string;
	transcript: string;
	/** A API devolve a lista serializada como string JSON (`"[\"a\",\"b\"]"`). */
	keyTakeaways: string | string[];
	startDate: string;
	createdAt: string;
	updatedAt: string;
};

type ApiInterview = {
	id: string;
	userId: number;
	stepId: string;
	profileInterviews?: ApiProfileInterview[];
	createdAt: string;
	updatedAt: string;
};

function parseTakeaways(value: string | string[] | null | undefined): string[] {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
	} catch {
		return [];
	}
}

function toInterview(interview: Pick<ApiInterview, "userId" | "stepId">, record: ApiProfileInterview): Interview {
	return {
		id: record.id,
		interviewId: record.interviewId,
		stepId: interview.stepId,
		userId: interview.userId,
		profileId: record.profileId,
		transcript: record.transcript,
		keyTakeaways: parseTakeaways(record.keyTakeaways),
		startDate: record.startDate,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

/** Todos os registros de candidatos da etapa. Entrevistas sem registro são ignoradas. */
export async function getInterviews(stepId: string): Promise<Interview[]> {
	const interviews = await apiClient.get<ApiInterview[]>(`/steps/${stepId}/interviews`);
	return interviews.flatMap((interview) =>
		(interview.profileInterviews ?? []).map((record) => toInterview(interview, record)),
	);
}

/**
 * Cria a entrevista do usuário logado na etapa e, dentro dela, o registro do
 * candidato. Se o registro falhar (ex.: candidato não vinculado à vaga), a
 * entrevista recém-criada é removida para não sobrar vazia.
 */
export async function createInterview(stepId: string, data: CreateInterviewInput): Promise<Interview> {
	const interview = await apiClient.post<ApiInterview>(`/steps/${stepId}/interviews`, {});
	try {
		const record = await apiClient.post<ApiProfileInterview>(
			`/profiles/${data.profileId}/add-interview`,
			{
				interviewId: interview.id,
				transcript: data.transcript,
				keyTakeaways: data.keyTakeaways ?? [],
				...(data.startDate ? {startDate: data.startDate} : {}),
			},
		);
		return toInterview(interview, record);
	} catch (error) {
		await apiClient.delete<void>(`/steps/${stepId}/interviews/${interview.id}`).catch(() => undefined);
		throw error;
	}
}

export async function updateInterview(
	interview: Interview,
	data: UpdateInterviewInput,
): Promise<Interview> {
	const record = await apiClient.patch<ApiProfileInterview>(
		`/profiles/${interview.profileId}/interviews/${interview.id}`,
		data,
	);
	return toInterview(interview, record);
}

/**
 * Remove o registro. Se era o único da entrevista, remove a entrevista inteira
 * (o que apaga o registro em cascata) para não deixar entrevista vazia.
 */
export function deleteInterview(interview: Interview, lastInInterview: boolean): Promise<void> {
	return lastInInterview
		? apiClient.delete<void>(`/steps/${interview.stepId}/interviews/${interview.interviewId}`)
		: apiClient.delete<void>(`/profiles/${interview.profileId}/interviews/${interview.id}`);
}
