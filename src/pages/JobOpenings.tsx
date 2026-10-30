import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {
	RiAddLine,
	RiBriefcase4Line,
	RiCalendarLine,
	RiDeleteBinLine,
	RiEditLine,
	RiMoneyDollarCircleLine,
	RiSearchLine,
} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import JobOpeningFormDialog from "../components/jobOpenings/JobOpeningFormDialog";
import {
	Button,
	CardGridSkeleton,
	Dialog,
	EmptyState,
	ErrorState,
	IconAction,
	ListToolbar,
	SearchInput,
	SegmentedControl,
	TagList,
} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {isApiError} from "../api/errors";
import {useJobOpenings} from "../hooks/useJobOpenings";
import {useSession} from "../hooks/useSession";
import type {CreateJobOpeningInput, JobOpening} from "../types/jobOpening";
import {formatCurrency, formatDate} from "../utils/format";
import {canManageJobOpening} from "../utils/permissions";
import {toPlainText} from "../utils/richText";

const VISIBLE_SKILLS = 4;
const GENERIC_DELETE_ERROR = "Não foi possível remover a vaga. Tente novamente.";

export default function JobOpenings(): JSX.Element {
	const session = useSession();
	const {jobOpenings, mine, setMine, loading, error, reload, create, update, remove} =
		useJobOpenings();
	const [search, setSearch] = useState("");

	const [formOpen, setFormOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);
	const [editing, setEditing] = useState<JobOpening | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<JobOpening | null>(null);
	const [deleting, setDeleting] = useState(false);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return jobOpenings;
		return jobOpenings.filter(
			(job) =>
				job.name.toLowerCase().includes(term) ||
				job.skills?.some((skill) => skill.skillName.toLowerCase().includes(term)),
		);
	}, [jobOpenings, search]);

	function openForm(job: JobOpening | null) {
		setEditing(job);
		setFormKey((key) => key + 1);
		setFormOpen(true);
	}

	async function handleSubmit(data: CreateJobOpeningInput) {
		if (editing) {
			await update(editing.id, data);
			toast.success("Vaga atualizada com sucesso");
		} else {
			await create(data);
			toast.success("Vaga criada com sucesso");
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await remove(deleteTarget.id);
			toast.success("Vaga removida com sucesso");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_ERROR);
		} finally {
			setDeleting(false);
		}
	}

	return (
		<>
			<PageHeader
				title="Vagas"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Vagas", href: "/vagas"},
				]}
				actions={
					<Button size="sm" onClick={() => openForm(null)}>
						<RiAddLine className="size-4" />
						Criar vaga
					</Button>
				}
			/>

			<ListToolbar
				count={
					!loading && !error
						? search.trim()
							? `${filtered.length} de ${jobOpenings.length} vagas`
							: `${jobOpenings.length} ${jobOpenings.length === 1 ? "vaga" : "vagas"}`
						: undefined
				}>
				<SegmentedControl
					label="Filtrar vagas"
					value={mine ? "mine" : "all"}
					onChange={(value) => setMine(value === "mine")}
					options={[
						{value: "all", label: "Todas"},
						{value: "mine", label: "Minhas vagas"},
					]}
				/>
				<SearchInput
					label="Buscar por nome ou competência"
					value={search}
					onChange={setSearch}
					className="sm:w-72"
				/>
			</ListToolbar>

			{error ? (
				<ErrorState title="Não foi possível carregar as vagas" message={error} onRetry={reload} />
			) : loading ? (
				<CardGridSkeleton label="Carregando vagas" />
			) : jobOpenings.length === 0 ? (
				<EmptyState
					icon={<RiBriefcase4Line className="size-5" />}
					title={mine ? "Você ainda não criou vagas" : "Nenhuma vaga cadastrada"}
					description="Crie uma vaga para montar as etapas do processo e receber candidatos."
					action={
						<Button size="sm" onClick={() => openForm(null)}>
							<RiAddLine className="size-4" />
							Criar vaga
						</Button>
					}
				/>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={<RiSearchLine className="size-5" />}
					title="Nenhuma vaga encontrada"
					description={<>Nenhuma vaga corresponde a “{search.trim()}”. Tente outro nome ou competência.</>}
					action={
						<Button size="sm" variant="ghost" onClick={() => setSearch("")}>
							Limpar busca
						</Button>
					}
				/>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filtered.map((job) => {
						const canManage = canManageJobOpening(session?.user, job);
						const description = toPlainText(job.description).trim();
						return (
							<li key={job.id} className="tl-entity-card group">
								<div className="flex items-start justify-between gap-3">
									<h2 className="min-w-0 text-[0.9375rem] leading-6 font-semibold">
										{/* O link cobre o card inteiro; as ações ficam acima dele (z-10). */}
										<Link
											to={`/vagas/${job.id}`}
											className="group-hover:text-primary line-clamp-2 transition-colors after:absolute after:inset-0 after:rounded-box">
											{job.name}
										</Link>
									</h2>
									{canManage && (
										<div className="tl-row-actions relative z-10 -mt-1 -mr-1.5 flex shrink-0">
											<IconAction
												label={`Editar ${job.name}`}
												icon={<RiEditLine className="size-4" />}
												onClick={() => openForm(job)}
											/>
											<IconAction
												label={`Remover ${job.name}`}
												icon={<RiDeleteBinLine className="size-4" />}
												danger
												onClick={() => setDeleteTarget(job)}
											/>
										</div>
									)}
								</div>

								<p className="text-base-content/65 mt-1 line-clamp-2 text-sm leading-5">
									{description || <span className="text-base-content/40 italic">Sem descrição</span>}
								</p>

								{(job.skills?.length ?? 0) > 0 && (
									<div className="mt-3">
										<TagList
											max={VISIBLE_SKILLS}
											items={[...(job.skills ?? [])]
												.sort((a, b) => Number(b.isRequired) - Number(a.isRequired))
												.map((skill) => ({
													id: skill.skillId,
													label: skill.skillName,
													variant: skill.isRequired ? "primary" : "neutral",
												}))}
										/>
									</div>
								)}

								<div className="mt-auto pt-4">
									<div className="border-base-300 text-base-content/55 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
										<span className="text-base-content/80 flex items-center gap-1.5 font-medium tabular-nums">
											<RiMoneyDollarCircleLine aria-hidden="true" className="text-base-content/45 size-4" />
											{formatCurrency(job.expectedWage)}
										</span>
										<span className="flex items-center gap-1.5">
											<RiCalendarLine aria-hidden="true" className="text-base-content/45 size-4" />
											Criada em {formatDate(job.createdAt)}
										</span>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<JobOpeningFormDialog
				key={formKey}
				open={formOpen}
				onClose={() => setFormOpen(false)}
				jobOpening={editing}
				onSubmit={handleSubmit}
			/>

			<Dialog
				open={deleteTarget !== null}
				onClose={() => !deleting && setDeleteTarget(null)}
				title="Remover vaga?"
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
					Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? As etapas e os
					registros de entrevista dessa vaga também serão removidos. Essa ação não poderá ser
					desfeita.
				</p>
			</Dialog>
		</>
	);
}
