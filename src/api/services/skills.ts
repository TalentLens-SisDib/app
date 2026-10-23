import {apiClient} from "../client";
import type {CreateSkillInput, Skill, UpdateSkillInput} from "../../types/skill";

export function getSkills(): Promise<Skill[]> {
	return apiClient.get<Skill[]>("/skills");
}

/** Qualquer usuário cria; o nome é único (a API responde 409 se já existir). */
export function createSkill(data: CreateSkillInput): Promise<Skill> {
	return apiClient.post<Skill>("/skills", data);
}

/** Restrito a administradores. */
export function updateSkill(id: string, data: UpdateSkillInput): Promise<Skill> {
	return apiClient.patch<Skill>(`/skills/${id}`, data);
}

/** Restrito a administradores. */
export function deleteSkill(id: string): Promise<void> {
	return apiClient.delete<void>(`/skills/${id}`);
}
