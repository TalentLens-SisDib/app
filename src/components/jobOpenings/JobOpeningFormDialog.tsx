import {useState, type SubmitEvent, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiCloseLine} from "@remixicon/react";
import {Alert, Button, CurrencyInput, Dialog, Input, RichTextEditor, Spinner} from "../ui";
import SkillPicker from "./SkillPicker";
import {isApiError} from "../../api/errors";
import {useSkills} from "../../hooks/useSkills";
import type {
	CreateJobOpeningInput,
	JobOpening,
	JobOpeningSkillInput,
} from "../../types/jobOpening";

type FormState = {
	name: string;
	description: string;
	expectedWage: number | null;
	skills: JobOpeningSkillInput[];
};

type FormErrors = Partial<Record<"name" | "description" | "expectedWage", string>>;

export type JobOpeningFormDialogProps = {
	open: boolean;
	onClose: () => void;
	/** Vaga em edição; ausente para criação. */
	jobOpening?: JobOpening | null;
	onSubmit: (data: CreateJobOpeningInput) => Promise<unknown>;
};

const GENERIC_FORM_ERROR = "Não foi possível salvar a vaga. Tente novamente.";

function toFormState(jobOpening?: JobOpening | null): FormState {
	if (!jobOpening) return {name: "", description: "", expectedWage: null, skills: []};
	const wage = Number(jobOpening.expectedWage);
	return {
		name: jobOpening.name,
		description: jobOpening.description,
		expectedWage: Number.isFinite(wage) ? wage : null,
		skills: (jobOpening.skills ?? []).map(({skillId, isRequired}) => ({skillId, isRequired})),
	};
}

/**
 * Formulário de criação/edição de vaga. O estado é inicializado na montagem —
 * quem abre o diálogo troca a `key` para recomeçar a partir da vaga certa.
 */
export default function JobOpeningFormDialog({
	open,
	onClose,
	jobOpening,
	onSubmit,
}: JobOpeningFormDialogProps): JSX.Element {
	const {
		skills,
		loading: skillsLoading,
		error: skillsError,
		create: createSkill,
	} = useSkills();
	const [form, setForm] = useState<FormState>(() => toFormState(jobOpening));
	const [errors, setErrors] = useState<FormErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const editing = Boolean(jobOpening);
	const selectedIds = new Set(form.skills.map((skill) => skill.skillId));
	const skillName = (id: string) =>
		skills.find((skill) => skill.id === id)?.name ??
		jobOpening?.skills?.find((skill) => skill.skillId === id)?.skillName ??
		"Competência";

	function close() {
		if (!submitting) onClose();
	}

	function addSkill(skillId: string) {
		setForm((prev) =>
			prev.skills.some((skill) => skill.skillId === skillId)
				? prev
				: {...prev, skills: [...prev.skills, {skillId, isRequired: true}]},
		);
	}

	function toggleRequired(skillId: string) {
		setForm((prev) => ({
			...prev,
			skills: prev.skills.map((skill) =>
				skill.skillId === skillId ? {...skill, isRequired: !skill.isRequired} : skill,
			),
		}));
	}

	function removeSkill(skillId: string) {
		setForm((prev) => ({...prev, skills: prev.skills.filter((skill) => skill.skillId !== skillId)}));
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const nextErrors: FormErrors = {};
		if (!form.name.trim()) nextErrors.name = "Informe o nome da vaga.";
		if (!form.description) nextErrors.description = "Descreva a vaga.";
		if (form.expectedWage === null) nextErrors.expectedWage = "Informe a remuneração esperada.";

		setErrors(nextErrors);
		setFormError(null);
		if (Object.keys(nextErrors).length > 0 || form.expectedWage === null) return;

		setSubmitting(true);
		try {
			await onSubmit({
				name: form.name.trim(),
				description: form.description,
				expectedWage: form.expectedWage,
				skills: form.skills,
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
			title={editing ? "Editar vaga" : "Criar vaga"}
			actions={
				<>
					<Button variant="ghost" disabled={submitting} onClick={close}>
						Cancelar
					</Button>
					<Button type="submit" form="job-opening-form" loading={submitting}>
						{editing ? "Salvar" : "Criar"}
					</Button>
				</>
			}>
			<form id="job-opening-form" className="space-y-5" noValidate onSubmit={handleSubmit}>
				{formError && (
					<Alert variant="error" title="Não foi possível salvar">
						{formError}
					</Alert>
				)}

				<div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
					<Input
						label="Nome"
						required
						placeholder="Ex.: Desenvolvedor(a) Front-end Pleno"
						maxLength={200}
						value={form.name}
						onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
						error={errors.name}
					/>
					<CurrencyInput
						label="Remuneração"
						required
						placeholder="R$ 0,00"
						value={form.expectedWage}
						onChange={(expectedWage) => setForm((prev) => ({...prev, expectedWage}))}
						error={errors.expectedWage}
					/>
				</div>

				<RichTextEditor
					label="Descrição"
					required
					placeholder="Contexto do time, responsabilidades, requisitos, benefícios..."
					value={form.description}
					onChange={(description) => setForm((prev) => ({...prev, description}))}
					error={errors.description}
				/>

				<fieldset className="space-y-2">
					<legend className="ds-field-label">Competências</legend>

					{skillsError ? (
						<p className="ds-field-note ds-field-note-error">{skillsError}</p>
					) : skillsLoading ? (
						<div className="text-base-content/60 flex items-center gap-2 text-sm">
							<Spinner size="xs" /> Carregando competências...
						</div>
					) : (
						<SkillPicker
							skills={skills}
							selectedIds={selectedIds}
							disabled={submitting}
							onSelect={(skill) => addSkill(skill.id)}
							onCreate={(name) => createSkill({name})}
						/>
					)}

					{form.skills.length > 0 ? (
						<ul className="border-base-300 divide-base-300 rounded-box divide-y border">
							{form.skills.map((skill) => (
								<li key={skill.skillId} className="flex items-center gap-3 px-3 py-2">
									<span className="min-w-0 flex-1 truncate text-sm font-medium">
										{skillName(skill.skillId)}
									</span>
									<label className="text-base-content/70 flex cursor-pointer items-center gap-2 text-xs">
										<input
											type="checkbox"
											className="toggle toggle-primary toggle-sm"
											checked={skill.isRequired}
											onChange={() => toggleRequired(skill.skillId)}
										/>
										<span className="w-20">{skill.isRequired ? "Obrigatória" : "Desejável"}</span>
									</label>
									<button
										type="button"
										aria-label={`Remover ${skillName(skill.skillId)}`}
										onClick={() => removeSkill(skill.skillId)}
										className="btn btn-ghost btn-xs btn-square">
										<RiCloseLine className="size-4" />
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className="ds-field-note ds-field-note-muted">
							Adicione as competências da vaga e marque quais são obrigatórias. O catálogo
							completo fica em{" "}
							<Link to="/competencias" className="link" onClick={close}>
								Competências
							</Link>
							.
						</p>
					)}
				</fieldset>
			</form>
		</Dialog>
	);
}
