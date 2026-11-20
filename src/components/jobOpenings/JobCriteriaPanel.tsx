import {useState, type JSX, type SubmitEvent} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine, RiInformationLine} from "@remixicon/react";
import {isApiError} from "../../api/errors";
import {CRITERION_DESCRIPTION_MAX_LENGTH, CRITERION_NAME_MAX_LENGTH} from "../../api/services/jobCriteria";
import {generateJobCriterionSuggestions} from "../../api/services/jobCriterionSuggestions";
import {useJobCriteria} from "../../hooks/useJobCriteria";
import type {JobCriterion} from "../../types/jobCriterion";
import type {EditableJobCriterionSuggestion} from "../../types/jobCriterionSuggestion";
import {Alert, Button, Dialog, Input, Spinner, Textarea} from "../ui";
import {toast} from "../ui/toastStore";
import {isExistingJobCriterion, prepareJobCriterionSuggestions} from "../../utils/jobCriterionSuggestions";

const GENERIC_FORM_ERROR = "Não foi possível salvar o critério. Tente novamente.";
const GENERIC_DELETE_ERROR = "Não foi possível remover o critério. Tente novamente.";

type JobCriteriaPanelProps = {
	jobOpeningId: string;
	canManage: boolean;
};

export default function JobCriteriaPanel({jobOpeningId, canManage}: JobCriteriaPanelProps): JSX.Element {
	const {criteria, loading, error, reload, create, update, remove} = useJobCriteria(jobOpeningId);
	const [formOpen, setFormOpen] = useState(false);
	const [editingCriterion, setEditingCriterion] = useState<JobCriterion | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [nameError, setNameError] = useState<string | undefined>();
	const [descriptionError, setDescriptionError] = useState<string | undefined>();
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<JobCriterion | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [suggestions, setSuggestions] = useState<EditableJobCriterionSuggestion[]>([]);
	const [suggestionsLoading, setSuggestionsLoading] = useState(false);
	const [suggestionsGenerated, setSuggestionsGenerated] = useState(false);
	const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
	const [addingSuggestions, setAddingSuggestions] = useState(false);
	const existingNames = criteria.map((criterion) => criterion.name);
	const selectedSuggestions = suggestions.filter((suggestion) => suggestion.selected);
	const canAddSelectedSuggestions =
		selectedSuggestions.length > 0 &&
		selectedSuggestions.every((suggestion, index) => {
			const otherSelectedNames = selectedSuggestions
				.filter((_, otherIndex) => otherIndex !== index)
				.map((other) => other.name);
			return (
				suggestion.name.trim().length > 0 &&
				!isExistingJobCriterion(suggestion.name, existingNames) &&
				!isExistingJobCriterion(suggestion.name, otherSelectedNames)
			);
		});

	function resetForm(criterion: JobCriterion | null) {
		setEditingCriterion(criterion);
		setName(criterion?.name ?? "");
		setDescription(criterion?.description ?? "");
		setNameError(undefined);
		setDescriptionError(undefined);
		setFormError(null);
		setFormOpen(true);
	}

	function closeForm() {
		if (!submitting) setFormOpen(false);
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const trimmedName = name.trim();
		const trimmedDescription = description.trim();
		const nextNameError = !trimmedName
			? "Informe o nome do critério."
			: trimmedName.length > CRITERION_NAME_MAX_LENGTH
				? "Use no máximo 200 caracteres."
				: undefined;
		const nextDescriptionError =
			trimmedDescription.length > CRITERION_DESCRIPTION_MAX_LENGTH
				? "Use no máximo 2000 caracteres."
				: undefined;
		setNameError(nextNameError);
		setDescriptionError(nextDescriptionError);
		setFormError(null);
		if (nextNameError || nextDescriptionError) return;

		setSubmitting(true);
		try {
			const data = {name: trimmedName, description: trimmedDescription};
			if (editingCriterion) {
				await update(editingCriterion.id, data);
				toast.success("Critério atualizado com sucesso");
			} else {
				await create(data);
				toast.success("Critério criado com sucesso");
			}
			setFormOpen(false);
		} catch (err) {
			setFormError(isApiError(err) ? err.message : GENERIC_FORM_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await remove(deleteTarget.id);
			toast.success("Critério removido com sucesso");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_ERROR);
		} finally {
			setDeleting(false);
		}
	}

	async function requestSuggestions() {
		if (suggestionsLoading || suggestions.length > 0) return;
		setSuggestionsLoading(true);
		setSuggestionsError(null);
		setSuggestionsGenerated(false);
		try {
			const generated = await generateJobCriterionSuggestions(jobOpeningId);
			setSuggestions(
				prepareJobCriterionSuggestions(generated, existingNames, () => crypto.randomUUID()),
			);
			setSuggestionsGenerated(true);
		} catch (err) {
			setSuggestionsError(isApiError(err) ? err.message : "Não foi possível gerar sugestões de critérios.");
		} finally {
			setSuggestionsLoading(false);
		}
	}

	function updateSuggestion(id: string, update: Partial<EditableJobCriterionSuggestion>) {
		setSuggestions((current) =>
			current.map((suggestion) => (suggestion.id === id ? {...suggestion, ...update} : suggestion)),
		);
	}

	async function addSelectedSuggestions() {
		if (!canAddSelectedSuggestions || addingSuggestions) return;
		setAddingSuggestions(true);
		setSuggestionsError(null);
		let added = 0;
		const knownNames = [...existingNames];
		try {
			for (const suggestion of selectedSuggestions) {
				if (isExistingJobCriterion(suggestion.name, knownNames)) {
					throw new Error(`O critério “${suggestion.name}” já foi adicionado.`);
				}
				await create({name: suggestion.name.trim(), description: suggestion.description.trim()});
				knownNames.push(suggestion.name.trim());
				added += 1;
				setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
			}
			if (suggestions.length === added) setSuggestionsGenerated(false);
			toast.success(`${added} ${added === 1 ? "critério adicionado" : "critérios adicionados"} à vaga`);
		} catch (err) {
			const message = isApiError(err) ? err.message : err instanceof Error ? err.message : GENERIC_FORM_ERROR;
			setSuggestionsError(
				added > 0
					? `${added} ${added === 1 ? "critério foi salvo" : "critérios foram salvos"}. O restante não foi salvo: ${message}`
					: message,
			);
		} finally {
			setAddingSuggestions(false);
		}
	}

	return (
		<section aria-labelledby="job-criteria-title" className="border-base-300 mt-6 space-y-4 border-t pt-5">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-primary text-xs font-semibold tracking-wider uppercase">Avaliação</p>
					<h2 id="job-criteria-title" className="mt-0.5 text-lg font-semibold">
						Critérios de avaliação
					</h2>
					<p className="text-base-content/60 mt-1 text-sm">
						Aspectos que serão considerados na avaliação das candidaturas.
					</p>
				</div>
				{canManage && (
					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="outline"
							loading={suggestionsLoading}
							disabled={loading || suggestionsLoading || suggestions.length > 0 || addingSuggestions}
							onClick={requestSuggestions}>
							Sugerir com IA
						</Button>
						<Button size="sm" disabled={addingSuggestions} onClick={() => resetForm(null)}>
							<RiAddLine className="size-4" />
							Adicionar critério
						</Button>
					</div>
				)}
			</header>

			{suggestionsError && (
				<Alert variant="error" title="Não foi possível concluir a ação">
					{suggestionsError}
				</Alert>
			)}

			{suggestions.length > 0 && (
				<section
					aria-labelledby="criterion-suggestions-title"
					className="bg-primary/5 border-primary/15 rounded-box space-y-4 border p-4">
					<div>
						<h3 id="criterion-suggestions-title" className="font-semibold">
							Sugestões para revisar
						</h3>
						<p className="text-base-content/65 mt-1 text-sm">
							Revise e edite as sugestões. Elas só serão adicionadas à vaga depois que você selecioná-las.
						</p>
					</div>
					<ul className="space-y-3">
						{suggestions.map((suggestion) => {
							const existingDuplicate = isExistingJobCriterion(suggestion.name, existingNames);
							const suggestionDuplicate = suggestions.some(
								(other) =>
									other.id !== suggestion.id &&
									isExistingJobCriterion(suggestion.name, [other.name]),
							);
							const duplicate = existingDuplicate || suggestionDuplicate;
							return (
								<li key={suggestion.id} className="border-base-300 rounded-box bg-base-100 space-y-3 border p-3">
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											className="checkbox checkbox-primary checkbox-sm"
											aria-label={`Selecionar ${suggestion.name || "sugestão sem nome"}`}
											checked={suggestion.selected}
											disabled={addingSuggestions || (!suggestion.selected && (duplicate || !suggestion.name.trim()))}
											onChange={(event) => updateSuggestion(suggestion.id, {selected: event.target.checked})}
										/>
										<span className="text-sm font-medium">Selecionar para adicionar</span>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<Input
											label="Nome do critério"
											required
											maxLength={CRITERION_NAME_MAX_LENGTH}
											value={suggestion.name}
											disabled={addingSuggestions}
											onChange={(event) => updateSuggestion(suggestion.id, {name: event.target.value})}
										/>
										<Textarea
											label="Descrição"
											rows={3}
											maxLength={CRITERION_DESCRIPTION_MAX_LENGTH}
											value={suggestion.description}
											disabled={addingSuggestions}
											helperText={`${suggestion.description.length}/${CRITERION_DESCRIPTION_MAX_LENGTH} caracteres`}
											onChange={(event) => updateSuggestion(suggestion.id, {description: event.target.value})}
										/>
									</div>
									{duplicate && (
										<p className="ds-field-note ds-field-note-error">
											{existingDuplicate
												? "Esse nome já existe nos critérios da vaga. Edite a sugestão ou descarte-a."
												: "Esse nome também aparece em outra sugestão. Edite uma delas antes de selecionar."}
										</p>
									)}
								</li>
							);
						})}
					</ul>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-base-content/60 text-sm" aria-live="polite">
							{selectedSuggestions.length} selecionada(s)
						</p>
						<div className="flex flex-wrap gap-2">
							<Button
								size="sm"
								variant="ghost"
								disabled={addingSuggestions}
								onClick={() => {
									setSuggestions([]);
										setSuggestionsGenerated(false);
									setSuggestionsError(null);
								}}>
								Descartar
							</Button>
							<Button size="sm" loading={addingSuggestions} disabled={!canAddSelectedSuggestions} onClick={addSelectedSuggestions}>
								Adicionar selecionadas
							</Button>
						</div>
					</div>
				</section>
			)}

			{suggestionsGenerated && suggestions.length === 0 && !suggestionsLoading && !suggestionsError && (
				<p className="text-base-content/60 text-sm" role="status">
					Nenhuma sugestão nova foi encontrada. Você ainda pode criar critérios manualmente.
				</p>
			)}

			<p className="text-base-content/55 flex items-center gap-1.5 text-xs">
				<RiInformationLine className="size-4 shrink-0" aria-hidden="true" />
				Salvos neste navegador
			</p>

			{error ? (
				<Alert variant="error" title="Não foi possível carregar os critérios">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : loading ? (
				<div className="flex items-center gap-3 py-6">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando critérios...</p>
				</div>
			) : criteria.length === 0 ? (
				<div className="rounded-box border-base-300 flex flex-col items-center gap-3 border border-dashed px-4 py-8 text-center">
					<p className="text-base-content/60 text-sm">Nenhum critério cadastrado para esta vaga.</p>
					{canManage && (
						<Button size="sm" variant="outline" onClick={() => resetForm(null)}>
							<RiAddLine className="size-4" />
							Criar primeiro critério
						</Button>
					)}
				</div>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2">
					{criteria.map((criterion) => (
						<li key={criterion.id} className="rounded-box border-base-300 flex min-w-0 items-start gap-3 border p-4">
							<div className="min-w-0 flex-1">
								<h3 className="break-words font-medium [overflow-wrap:anywhere]">{criterion.name}</h3>
								{criterion.description && (
									<p className="text-base-content/65 mt-1 text-sm leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
										{criterion.description}
									</p>
								)}
							</div>
							{canManage && (
								<div className="flex shrink-0 gap-1">
									<button
										type="button"
										aria-label={`Editar critério ${criterion.name}`}
										onClick={() => resetForm(criterion)}
										className="btn btn-ghost btn-sm btn-square">
										<RiEditLine className="size-4" />
									</button>
									<button
										type="button"
										aria-label={`Remover critério ${criterion.name}`}
										onClick={() => setDeleteTarget(criterion)}
										className="btn btn-ghost btn-sm btn-square text-error">
										<RiDeleteBinLine className="size-4" />
									</button>
								</div>
							)}
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={formOpen}
				onClose={closeForm}
				title={editingCriterion ? "Editar critério" : "Novo critério"}
				actions={
					<>
						<Button variant="ghost" disabled={submitting} onClick={closeForm}>
							Cancelar
						</Button>
						<Button type="submit" form="job-criterion-form" loading={submitting}>
							{editingCriterion ? "Salvar" : "Criar"}
						</Button>
					</>
				}>
				<form id="job-criterion-form" className="space-y-4" noValidate onSubmit={handleSubmit}>
					{formError && (
						<Alert variant="error" title="Não foi possível salvar">
							{formError}
						</Alert>
					)}
					<Input
						label="Nome"
						required
						maxLength={CRITERION_NAME_MAX_LENGTH}
						placeholder="Ex.: Comunicação com clientes"
						value={name}
						onChange={(event) => setName(event.target.value)}
						error={nameError}
					/>
					<Textarea
						label="Descrição"
						rows={4}
						maxLength={CRITERION_DESCRIPTION_MAX_LENGTH}
						placeholder="O que observar neste critério? (opcional)"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						error={descriptionError}
						helperText={`${description.length}/${CRITERION_DESCRIPTION_MAX_LENGTH} caracteres`}
					/>
				</form>
			</Dialog>

			<Dialog
				open={deleteTarget !== null}
				onClose={() => !deleting && setDeleteTarget(null)}
				title="Remover critério?"
				actions={
					<>
						<Button variant="ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>
							Cancelar
						</Button>
						<Button variant="error" loading={deleting} onClick={confirmDelete}>
							Remover
						</Button>
					</>
				}>
				<p>
					Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Essa ação não poderá ser desfeita.
				</p>
			</Dialog>
		</section>
	);
}
