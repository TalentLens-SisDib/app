import {apiClient} from "../client";
import type {CreateCulturalFitInput, CulturalFit} from "../../types/culturalFit";

export function getCulturalFits(): Promise<CulturalFit[]> {
	return apiClient.get<CulturalFit[]>("/cultural-fits");
}

/** Qualquer usuário cria; o nome é único (a API responde 409 se já existir). */
export function createCulturalFit(data: CreateCulturalFitInput): Promise<CulturalFit> {
	return apiClient.post<CulturalFit>("/cultural-fits", data);
}
