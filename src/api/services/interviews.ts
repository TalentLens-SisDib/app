import {apiClient} from "../client";
import type {
	CreateInterviewInput,
	Interview,
	UpdateInterviewInput,
} from "../../types/interview";

export function getInterviews(stepId: string): Promise<Interview[]> {
	return apiClient.get<Interview[]>(`/steps/${stepId}/interviews`);
}

/** Cria o registro do usuário logado — a API recusa um segundo registro na mesma etapa. */
export function createInterview(stepId: string, data: CreateInterviewInput): Promise<Interview> {
	return apiClient.post<Interview>(`/steps/${stepId}/interviews`, data);
}

export function updateInterview(
	stepId: string,
	id: string,
	data: UpdateInterviewInput,
): Promise<Interview> {
	return apiClient.patch<Interview>(`/steps/${stepId}/interviews/${id}`, data);
}

export function deleteInterview(stepId: string, id: string): Promise<void> {
	return apiClient.delete<void>(`/steps/${stepId}/interviews/${id}`);
}
