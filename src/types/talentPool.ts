import type {ProfileCulturalFit, ProfileSkill} from "./profile";

/**
 * Candidato guardado no banco de talentos para futuras vagas
 * (`TalentPoolEntry` na API). Um perfil aparece no máximo uma vez.
 */
export type TalentPoolEntry = {
	profileId: string;
	/** Por que o candidato é promissor. */
	note: string | null;
	addedAt: string;
	updatedAt: string;
	/** `null` se o usuário que adicionou foi removido. */
	addedBy: {id: number; name: string} | null;
	profile: {
		id: string;
		name: string;
		description: string | null;
		skills: ProfileSkill[];
		culturalFits: ProfileCulturalFit[];
	};
};

export type SaveTalentPoolEntryInput = {
	/** `null` (ou ausente) remove a nota. */
	note?: string | null;
};
