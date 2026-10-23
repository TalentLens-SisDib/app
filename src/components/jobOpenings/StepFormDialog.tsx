import {useState, type SubmitEvent, type JSX} from "react";
import {Alert, Button, Dialog, Input, RichTextEditor} from "../ui";
import {isApiError} from "../../api/errors";
import type {CreateStepInput, Step} from "../../types/step";

type FormErrors = Partial<Record<"name" | "order" | "description", string>>;

/** Limite da API — conta o HTML da formatação, não só o texto visível. */
const DESCRIPTION_MAX_LENGTH = 2000;

export type StepFormDialogProps = {
	open: boolean;
	onClose: () => void;
	/** Etapa em edição; ausente para criação. */
	step?: Step | null;
	/** Ordem sugerida para uma etapa nova (próxima posição livre). */
	nextOrder: number;
	/** Ordens já usadas pelas outras etapas da vaga. */
	takenOrders: number[];
	onSubmit: (data: CreateStepInput) => Promise<unknown>;
};

const GENERIC_FORM_ERROR = "Não foi possível salvar a etapa. Tente novamente.";

/** Estado inicializado na montagem — quem abre troca a `key` do componente. */
export default function StepFormDialog({
	open,
	onClose,
	step,
	nextOrder,
	takenOrders,
	onSubmit,
}: StepFormDialogProps): JSX.Element {
	const [name, setName] = useState(step?.name ?? "");
	const [description, setDescription] = useState(step?.description ?? "");
	const [order, setOrder] = useState(String(step?.order ?? nextOrder));
	const [errors, setErrors] = useState<FormErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function close() {
		if (!submitting) onClose();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const parsedOrder = Number(order);
		const nextErrors: FormErrors = {};
		if (!name.trim()) nextErrors.name = "Informe o nome da etapa.";
		if (!Number.isInteger(parsedOrder) || parsedOrder < 1)
			nextErrors.order = "Informe um número inteiro a partir de 1.";
		// Validado aqui porque a API responde ordem repetida com erro 500 genérico.
		else if (takenOrders.includes(parsedOrder))
			nextErrors.order = "Já existe uma etapa com essa ordem.";
		if (description.length > DESCRIPTION_MAX_LENGTH)
			nextErrors.description = "Descrição longa demais. Reduza o texto ou a formatação.";

		setErrors(nextErrors);
		setFormError(null);
		if (Object.keys(nextErrors).length > 0) return;

		setSubmitting(true);
		try {
			await onSubmit({
				name: name.trim(),
				// String vazia (não `undefined`) para que limpar a descrição chegue à API no PATCH.
				description,
				order: parsedOrder,
			});
			onClose();
		} catch (err) {
			setFormError(isApiError(err) ? err.message : GENERIC_FORM_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={close}
			size="lg"
			title={step ? "Editar etapa" : "Nova etapa"}
			actions={
				<>
					<Button variant="ghost" disabled={submitting} onClick={close}>
						Cancelar
					</Button>
					<Button type="submit" form="step-form" loading={submitting}>
						{step ? "Salvar" : "Criar"}
					</Button>
				</>
			}>
			<form id="step-form" className="space-y-4" noValidate onSubmit={handleSubmit}>
				{formError && (
					<Alert variant="error" title="Não foi possível salvar">
						{formError}
					</Alert>
				)}

				<div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
					<Input
						label="Nome"
						required
						maxLength={200}
						placeholder="Ex.: Entrevista técnica"
						value={name}
						onChange={(event) => setName(event.target.value)}
						error={errors.name}
					/>
					<Input
						label="Ordem"
						required
						type="number"
						min={1}
						step={1}
						value={order}
						onChange={(event) => setOrder(event.target.value)}
						error={errors.order}
					/>
				</div>

				<RichTextEditor
					label="Descrição"
					minHeightClass="min-h-28"
					placeholder="O que é avaliado nesta etapa, roteiro de perguntas, critérios... (opcional)"
					value={description}
					onChange={setDescription}
					error={errors.description}
				/>
			</form>
		</Dialog>
	);
}
