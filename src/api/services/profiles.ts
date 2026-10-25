import {apiClient} from "../client";
import type {Profile} from "../../types/profile";

export function getProfiles(): Promise<Profile[]> {
	return apiClient.get<Profile[]>("/profiles");
}

export function getProfile(id: string, signal?: AbortSignal): Promise<Profile> {
	return apiClient.get<Profile>(`/profiles/${id}`, {signal});
}

/**
 * Envia um currículo para leitura. A API responde com o perfil final já criado.
 */
export function uploadCv(file: File, signal?: AbortSignal): Promise<Profile> {
	const form = new FormData();
	form.append("cv", file, file.name);

	return apiClient.post<Profile>("/profiles/upload-cv", form, {signal});
}

export function deleteProfile(id: string): Promise<void> {
	return apiClient.delete<void>(`/profiles/${id}`);
}
