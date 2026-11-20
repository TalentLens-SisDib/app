import {apiClient} from "../client";
import {parseJobCriterionSuggestions} from "../../utils/jobCriterionSuggestions";

/** Gera sugestões usando a descrição da vaga armazenada pela API. */
export async function generateJobCriterionSuggestions(jobOpeningId: string) {
	const response = await apiClient.post<unknown>(
		`/job-openings/${encodeURIComponent(jobOpeningId)}/criteria-suggestions`,
		{},
	);
	return parseJobCriterionSuggestions(response);
}
