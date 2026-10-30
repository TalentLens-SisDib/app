import {apiClient} from "../client";
import type {CreateApplicationInput, JobApplication} from "../../types/application";
import type {ProfileApplication} from "../../types/profile";

export function getApplications(jobOpeningId: string): Promise<JobApplication[]> {
	return apiClient.get<JobApplication[]>(`/job-openings/${jobOpeningId}/applications`);
}

/** Vagas de um perfil — vêm no campo `applications` de `GET /profiles/{id}`. */
export async function getProfileApplications(profileId: string): Promise<JobApplication[]> {
	const profile = await apiClient.get<{name: string; applications?: ProfileApplication[]}>(
		`/profiles/${profileId}`,
	);
	return (profile.applications ?? []).map((application) => ({
		...application,
		profileName: profile.name,
	}));
}

/** Só o dono da vaga ou um Admin. 409 se o candidato já está na vaga. */
export function createApplication(
	jobOpeningId: string,
	data: CreateApplicationInput,
): Promise<JobApplication> {
	return apiClient.post<JobApplication>(`/job-openings/${jobOpeningId}/applications`, data);
}

/** Só o dono da vaga ou um Admin. */
export function deleteApplication(jobOpeningId: string, profileId: string): Promise<void> {
	return apiClient.delete<void>(`/job-openings/${jobOpeningId}/applications/${profileId}`);
}
