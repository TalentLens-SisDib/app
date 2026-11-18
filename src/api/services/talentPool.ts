import {apiClient} from "../client";
import {isApiError} from "../errors";
import type {SaveTalentPoolEntryInput, TalentPoolEntry} from "../../types/talentPool";

/** Banco de talentos, do mais recente para o mais antigo. */
export function getTalentPool(signal?: AbortSignal): Promise<TalentPoolEntry[]> {
	return apiClient.get<TalentPoolEntry[]>("/talent-pool", {signal});
}

/** Entrada do perfil no banco de talentos, ou `null` se ele não está no banco (404). */
export async function getTalentPoolEntry(profileId: string, signal?: AbortSignal): Promise<TalentPoolEntry | null> {
	try {
		return await apiClient.get<TalentPoolEntry>(`/talent-pool/${profileId}`, {signal});
	} catch (err) {
		if (isApiError(err) && err.kind === "not_found") return null;
		throw err;
	}
}

/** Adiciona o perfil ao banco ou atualiza a nota (idempotente). */
export function saveTalentPoolEntry(profileId: string, data: SaveTalentPoolEntryInput): Promise<TalentPoolEntry> {
	return apiClient.put<TalentPoolEntry>(`/talent-pool/${profileId}`, data);
}

export function removeTalentPoolEntry(profileId: string): Promise<void> {
	return apiClient.delete<void>(`/talent-pool/${profileId}`);
}
