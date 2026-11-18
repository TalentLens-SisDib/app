import type {ClosureInput, ClosureReason} from "../types/application";

/** Ordem em que os motivos aparecem no formulário. */
export const CLOSURE_REASONS: ClosureReason[] = [
	"TechnicalMismatch",
	"BehavioralMismatch",
	"CandidateWithdrew",
	"OfferDeclined",
	"PositionFilled",
	"Other",
];

export const CLOSURE_REASON_LABEL: Record<ClosureReason, string> = {
	TechnicalMismatch: "Não atende aos requisitos técnicos",
	BehavioralMismatch: "Não atende ao perfil comportamental",
	CandidateWithdrew: "Candidato desistiu do processo",
	OfferDeclined: "Candidato recusou a proposta",
	PositionFilled: "Vaga preenchida por outro candidato",
	Other: "Outro motivo",
};

/** Mesmo limite que a API valida. */
export const CLOSURE_NOTES_MAX = 1000;

export type ClosureForm = {reason: ClosureReason | ""; notes: string};
export type ClosureFormErrors = Partial<Record<keyof ClosureForm, string>>;

/**
 * Valida o formulário de encerramento. Devolve o corpo para a API ou os
 * erros por campo. Observações vazias não são enviadas.
 */
export function validateClosureForm(
	form: ClosureForm,
): {ok: true; closure: ClosureInput} | {ok: false; errors: ClosureFormErrors} {
	const errors: ClosureFormErrors = {};
	const notes = form.notes.trim();

	if (!form.reason) errors.reason = "Selecione o motivo do encerramento.";
	if (form.reason === "Other" && !notes) errors.notes = "Descreva o motivo do encerramento.";
	if (notes.length > CLOSURE_NOTES_MAX) {
		errors.notes = `Use no máximo ${CLOSURE_NOTES_MAX} caracteres.`;
	}

	if (Object.keys(errors).length > 0 || !form.reason) return {ok: false, errors};
	return {ok: true, closure: notes ? {reason: form.reason, notes} : {reason: form.reason}};
}
