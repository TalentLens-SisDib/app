import {apiClient} from "../client";
import type {CreateStepInput, Step, UpdateStepInput} from "../../types/step";

export function getSteps(jobOpeningId: string): Promise<Step[]> {
	return apiClient.get<Step[]>(`/job-openings/${jobOpeningId}/steps`);
}

export function createStep(jobOpeningId: string, data: CreateStepInput): Promise<Step> {
	return apiClient.post<Step>(`/job-openings/${jobOpeningId}/steps`, data);
}

export function updateStep(jobOpeningId: string, id: string, data: UpdateStepInput): Promise<Step> {
	return apiClient.patch<Step>(`/job-openings/${jobOpeningId}/steps/${id}`, data);
}

export function deleteStep(jobOpeningId: string, id: string): Promise<void> {
	return apiClient.delete<void>(`/job-openings/${jobOpeningId}/steps/${id}`);
}
