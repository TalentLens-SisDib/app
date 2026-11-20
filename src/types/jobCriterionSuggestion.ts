/** Critério de avaliação sugerido pela IA para revisão do recrutador. */
export type JobCriterionSuggestion = {
	name: string;
	description: string;
};

export type EditableJobCriterionSuggestion = JobCriterionSuggestion & {
	id: string;
	selected: boolean;
};
