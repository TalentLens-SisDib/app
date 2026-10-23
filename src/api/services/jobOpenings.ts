import {apiClient} from "../client";
import type {
	CreateJobOpeningInput,
	JobOpening,
	UpdateJobOpeningInput,
} from "../../types/jobOpening";

/** `mine` restringe às vagas criadas pelo usuário logado. */
export function getJobOpenings(mine = false): Promise<JobOpening[]> {
	return apiClient.get<JobOpening[]>(mine ? "/job-openings?mine=true" : "/job-openings");
}

export function getJobOpening(id: string): Promise<JobOpening> {
	return apiClient.get<JobOpening>(`/job-openings/${id}`);
}

export function createJobOpening(data: CreateJobOpeningInput): Promise<JobOpening> {
	return apiClient.post<JobOpening>("/job-openings", data);
}

export function updateJobOpening(id: string, data: UpdateJobOpeningInput): Promise<JobOpening> {
	return apiClient.patch<JobOpening>(`/job-openings/${id}`, data);
}

export function deleteJobOpening(id: string): Promise<void> {
	return apiClient.delete<void>(`/job-openings/${id}`);
}
