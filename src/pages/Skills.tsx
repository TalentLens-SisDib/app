import {useMemo, useState, type SubmitEvent, type JSX} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine, RiMedalLine, RiSearchLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {
	Alert,
	Button,
	Dialog,
	EmptyState,
	ErrorState,
	IconAction,
	Input,
	ListToolbar,
	Pagination,
	SearchInput,
	TableSkeleton,
	Textarea,
} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {isApiError} from "../api/errors";
import {usePagination} from "../hooks/usePagination";
import {useSession} from "../hooks/useSession";
import {useSkills} from "../hooks/useSkills";
import type {Skill} from "../types/skill";
import {formatDate} from "../utils/format";
import {canManageSkills} from "../utils/permissions";

type FormState = {
	name: string;
	description: string;
};

const emptyForm: FormState = {name: "", description: ""};

const GENERIC_FORM_ERROR = "Não foi possível salvar a competência. Tente novamente.";
const GENERIC_DELETE_ERROR = "Não foi possível remover a competência. Tente novamente.";
const DUPLICATE_ERROR = "Já existe uma competência com esse nome.";
// A API não remove o vínculo com vagas em cascata — a exclusão falha no banco.
const IN_USE_ERROR = "Não foi possível remover: a competência provavelmente está em uso por uma vaga.";

export default function Skills(): JSX.Element {
	const session = useSession();
	const canManage = canManageSkills(session?.user);
	const {skills, loading, error, reload, create, update, remove} = useSkills();
	const [search, setSearch] = useState("");

	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [nameError, setNameError] = useState<string | undefined>();
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
	const [deleting, setDeleting] = useState(false);

	const filteredSkills = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return skills;
		return skills.filter(
			(skill) =>
				skill.name.toLowerCase().includes(term) ||
				skill.description?.toLowerCase().includes(term),
		);
	}, [skills, search]);
	const pagination = usePagination(filteredSkills);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setNameError(undefined);
		setFormError(null);
		setFormOpen(true);
	}

	function openEdit(skill: Skill) {
		setEditingId(skill.id);
		setForm({name: skill.name, description: skill.description ?? ""});
		setNameError(undefined);
		setFormError(null);
		setFormOpen(true);
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const name = form.name.trim();
		const nextNameError = !name
			? "Informe o nome da competência."
			: skills.some(
						(skill) =>
							skill.id !== editingId && skill.name.toLowerCase() === name.toLowerCase(),
				  )
				? DUPLICATE_ERROR
				: undefined;
		setNameError(nextNameError);
		setFormError(null);
		if (nextNameError) return;

		setSubmitting(true);
		try {
			const data = {name, description: form.description.trim()};
			if (editingId) {
				await update(editingId, data);
				toast.success("Competência atualizada com sucesso");
			} else {
				await create(data.description ? data : {name});
				toast.success("Competência criada com sucesso");
			}
			setFormOpen(false);
		} catch (err) {
			if (isApiError(err) && err.status === 409) setNameError(DUPLICATE_ERROR);
			else setFormError(isApiError(err) ? err.message : GENERIC_FORM_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await remove(deleteTarget.id);
			toast.success("Competência removida com sucesso");
			setDeleteTarget(null);
		} catch (err) {
			if (isApiError(err) && err.kind === "server") toast.error(IN_USE_ERROR, 6000);
			else toast.error(isApiError(err) ? err.message : GENERIC_DELETE_ERROR);
		} finally {
			setDeleting(false);
		}
	}

	function renderActions(skill: Skill) {
		if (!canManage) return null;
		return (
			<div className="tl-row-actions flex justify-end gap-0.5">
				<IconAction
					label={`Editar ${skill.name}`}
					icon={<RiEditLine className="size-4" />}
					tooltipPosition="left"
					onClick={() => openEdit(skill)}
				/>
				<IconAction
					label={`Remover ${skill.name}`}
					icon={<RiDeleteBinLine className="size-4" />}
					tooltipPosition="left"
					danger
					onClick={() => setDeleteTarget(skill)}
				/>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title="Competências"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Competências", href: "/competencias"},
				]}
				actions={
					<Button size="sm" onClick={openCreate}>
						<RiAddLine className="size-4" />
						Criar competência
					</Button>
				}
			/>

			<ListToolbar
				count={
					!loading && !error
						? search.trim()
							? `${filteredSkills.length} de ${skills.length} competências`
							: `${skills.length} ${skills.length === 1 ? "competência" : "competências"}`
						: undefined
				}>
				<SearchInput
					label="Buscar por nome ou descrição"
					value={search}
					onChange={setSearch}
					className="sm:w-80"
				/>
			</ListToolbar>

			{error ? (
				<ErrorState title="Não foi possível carregar as competências" message={error} onRetry={reload} />
			) : loading ? (
				<TableSkeleton label="Carregando competências" columns={canManage ? 4 : 3} />
			) : skills.length === 0 ? (
				<EmptyState
					icon={<RiMedalLine className="size-5" />}
					title="Nenhuma competência cadastrada"
					description="Competências descrevem o que as vagas exigem e o que os candidatos sabem fazer."
					action={
						<Button size="sm" onClick={openCreate}>
							<RiAddLine className="size-4" />
							Criar competência
						</Button>
					}
				/>
			) : filteredSkills.length === 0 ? (
				<EmptyState
					icon={<RiSearchLine className="size-5" />}
					title="Nenhuma competência encontrada"
					description={<>Nenhuma competência corresponde a “{search.trim()}”.</>}
					action={
						<Button size="sm" variant="ghost" onClick={() => setSearch("")}>
							Limpar busca
						</Button>
					}
				/>
			) : (
				<div className="tl-panel overflow-hidden">
					{/* Desktop/tablet: tabela */}
					<table className="tl-table hidden table-fixed sm:table">
						<colgroup>
							<col className="w-[28%]" />
							<col />
							<col className="w-36" />
							{canManage && <col className="w-24" />}
						</colgroup>
						<thead>
							<tr>
								<th scope="col">Nome</th>
								<th scope="col">Descrição</th>
								<th scope="col">Criada em</th>
								{canManage && (
									<th scope="col" className="text-right">
										<span className="sr-only">Ações</span>
									</th>
								)}
							</tr>
						</thead>
						<tbody>
							{pagination.pageItems.map((skill) => (
								<tr key={skill.id}>
									<td className="truncate font-medium" title={skill.name}>
										{skill.name}
									</td>
									<td className="text-base-content/65 truncate" title={skill.description || undefined}>
										{skill.description || <span className="text-base-content/35">—</span>}
									</td>
									<td className="text-base-content/60 whitespace-nowrap tabular-nums">
										{formatDate(skill.createdAt)}
									</td>
									{canManage && <td className="py-0">{renderActions(skill)}</td>}
								</tr>
							))}
						</tbody>
					</table>

					{/* Mobile: lista, sem overflow horizontal */}
					<ul className="divide-base-300 divide-y sm:hidden">
						{pagination.pageItems.map((skill) => (
							<li key={skill.id} className="flex items-center gap-3 px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{skill.name}</p>
									<p className="text-base-content/60 line-clamp-2 text-xs leading-5">
										{skill.description || `Criada em ${formatDate(skill.createdAt)}`}
									</p>
								</div>
								{renderActions(skill)}
							</li>
						))}
					</ul>

					<Pagination
						page={pagination.page}
						pageCount={pagination.pageCount}
						pageSize={pagination.pageSize}
						total={pagination.total}
						onPageChange={pagination.setPage}
						noun="competências"
					/>
				</div>
			)}

			<Dialog
				open={formOpen}
				onClose={() => !submitting && setFormOpen(false)}
				title={editingId ? "Editar competência" : "Criar competência"}
				actions={
					<>
						<Button variant="ghost" disabled={submitting} onClick={() => setFormOpen(false)}>
							Cancelar
						</Button>
						<Button type="submit" form="skill-form" loading={submitting}>
							{editingId ? "Salvar" : "Criar"}
						</Button>
					</>
				}>
				<form id="skill-form" className="space-y-4" noValidate onSubmit={handleSubmit}>
					{formError && (
						<Alert variant="error" title="Não foi possível salvar">
							{formError}
						</Alert>
					)}

					<Input
						label="Nome"
						required
						maxLength={100}
						placeholder="Ex.: TypeScript"
						value={form.name}
						onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
						error={nameError}
					/>
					<Textarea
						label="Descrição"
						rows={3}
						maxLength={500}
						placeholder="Contexto de uso da competência (opcional)"
						value={form.description}
						onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
						helperText={`${form.description.length}/500 caracteres`}
					/>
				</form>
			</Dialog>

			<Dialog
				open={deleteTarget !== null}
				onClose={() => !deleting && setDeleteTarget(null)}
				title="Remover competência?"
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
					Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Ela também sai dos
					perfis de candidatos. Competências usadas em vagas precisam ser retiradas delas antes.
					Essa ação não poderá ser desfeita.
				</p>
			</Dialog>
		</>
	);
}
