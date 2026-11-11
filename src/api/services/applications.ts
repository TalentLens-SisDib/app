import {apiClient} from "../client";
import type {
	CreateApplicationInput,
	JobApplication,
	JobApplicationResponse,
	UpdateApplicationStatusInput,
} from "../../types/application";
import type {ProfileApplication} from "../../types/profile";

function normalizeApplication(application: JobApplicationResponse): JobApplication {
	return {
		...application,
		currentStep: application.currentStep ?? null,
		status: application.status ?? "InProgress",
		stageUpdatedAt: application.stageUpdatedAt ?? application.appliedAt,
	};
}

export async function getApplications(jobOpeningId: string): Promise<JobApplication[]> {
	const applications = await apiClient.get<JobApplicationResponse[]>(
		`/job-openings/${jobOpeningId}/applications`,
	);
	return applications.map(normalizeApplication);
}

/** Vagas de um perfil — vêm no campo `applications` de `GET /profiles/{id}`. */
export async function getProfileApplications(profileId: string): Promise<JobApplication[]> {
	const profile = await apiClient.get<{name: string; applications?: ProfileApplication[]}>(
		`/profiles/${profileId}`,
	);
	return (profile.applications ?? []).map((application) =>
		normalizeApplication({...application, profileName: profile.name}),
	);
}

/** Só o dono da vaga ou um Admin. 409 se o candidato já está na vaga. */
export async function createApplication(
	jobOpeningId: string,
	data: CreateApplicationInput,
): Promise<JobApplication> {
	return normalizeApplication(
		await apiClient.post<JobApplicationResponse>(`/job-openings/${jobOpeningId}/applications`, data),
	);
}

export function advanceApplication(
	jobOpeningId: string,
	profileId: string,
	fromStepId: string | null,
): Promise<JobApplication> {
	return apiClient
		.post<JobApplicationResponse>(`/job-openings/${jobOpeningId}/applications/${profileId}/advance`, {
			fromStepId,
		})
		.then(normalizeApplication);
}

export function updateApplicationStatus(
	jobOpeningId: string,
	profileId: string,
	data: UpdateApplicationStatusInput,
): Promise<JobApplication> {
	return apiClient
		.patch<JobApplicationResponse>(`/job-openings/${jobOpeningId}/applications/${profileId}/status`, data)
		.then(normalizeApplication);
}

/** Só o dono da vaga ou um Admin. */
export function deleteApplication(jobOpeningId: string, profileId: string): Promise<void> {
	return apiClient.delete<void>(`/job-openings/${jobOpeningId}/applications/${profileId}`);
}
