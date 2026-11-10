export type CompetencyEvidenceSource = "curriculo" | "entrevista" | "avaliacao" | "outro";

/** Trecho de origem que fundamenta a avaliação de uma competência do candidato. */
export type CompetencyEvidence = {
	id: string;
	competencyId: string;
	competencyName: string;
	sourceType: CompetencyEvidenceSource;
	sourceLabel: string;
	excerpt: string;
	createdAt?: string;
};

export type CompetencyEvidenceGroup = {
	competencyId: string;
	competencyName: string;
	evidence: CompetencyEvidence[];
};
