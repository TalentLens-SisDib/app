/** Característica comportamental (fit cultural) cadastrada na API (`CulturalFit`). */
export type CulturalFit = {
	id: string;
	name: string;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
};

export type CreateCulturalFitInput = {
	name: string;
	description?: string;
};
