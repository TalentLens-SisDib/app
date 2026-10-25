import {useState, type JSX, type SubmitEvent} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine, RiInformationLine} from "@remixicon/react";
import {isApiError} from "../../api/errors";
import {CRITERION_DESCRIPTION_MAX_LENGTH, CRITERION_NAME_MAX_LENGTH} from "../../api/services/jobCriteria";
import {useJobCriteria} from "../../hooks/useJobCriteria";
import type {JobCriterion} from "../../types/jobCriterion";
import {Alert, Button, Dialog, Input, Spinner, Textarea} from "../ui";
import {toast} from "../ui/toastStore";

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
					<Button size="sm" onClick={() => resetForm(null)}>
						<RiAddLine className="size-4" />
						Adicionar critério
					</Button>
				)}
			</header>

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
