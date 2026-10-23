import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {
	RiAddLine,
	RiBriefcase4Line,
	RiCalendarLine,
	RiDeleteBinLine,
	RiEditLine,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import JobOpeningFormDialog from "../components/jobOpenings/JobOpeningFormDialog";
import {Alert, Badge, Button, Card, Dialog, Input, Spinner} from "../components/ui";
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

			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div role="tablist" aria-label="Filtrar vagas" className="tabs tabs-box tabs-sm w-fit">
						<button
							type="button"
							role="tab"
							aria-selected={!mine}
							onClick={() => setMine(false)}
							className={["tab", !mine && "tab-active"].filter(Boolean).join(" ")}>
							Todas
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={mine}
							onClick={() => setMine(true)}
							className={["tab", mine && "tab-active"].filter(Boolean).join(" ")}>
							Minhas vagas
						</button>
					</div>
					<div className="sm:w-72">
						<Input
							aria-label="Buscar por nome ou competência"
							placeholder="Buscar por nome ou competência"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
				</div>
				{!loading && !error && (
					<p className="text-base-content/60 shrink-0 text-sm">
						{filtered.length} de {jobOpenings.length} vaga(s)
					</p>
				)}
			</div>

			{error ? (
				<Alert variant="error" title="Não foi possível carregar as vagas">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : loading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando vagas...</p>
				</div>
			) : jobOpenings.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
						<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
							<RiBriefcase4Line className="size-6" />
						</span>
						<div>
							<p className="font-medium">
								{mine ? "Você ainda não criou vagas" : "Nenhuma vaga cadastrada"}
							</p>
							<p className="text-base-content/60 mt-1 text-sm">
								Crie uma vaga para montar as etapas do processo e registrar as entrevistas.
							</p>
						</div>
						<Button size="sm" onClick={() => openForm(null)}>
							<RiAddLine className="size-4" />
							Criar vaga
						</Button>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<p className="text-base-content/60 py-10 text-center text-sm">
					Nenhuma vaga encontrada para essa busca.
				</p>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filtered.map((job) => {
						const skills = job.skills ?? [];
						const canManage = canManageJobOpening(session?.user, job);
						return (
							<li
								key={job.id}
								className="card border-base-300 bg-base-100 hover:border-primary/40 group relative border shadow-sm transition-colors">
								<div className="card-body gap-3 p-5">
									<div className="flex items-start justify-between gap-2">
										<h2 className="min-w-0 text-base leading-6 font-semibold">
											{/* O link cobre o card inteiro; as ações ficam acima dele (z-10). */}
											<Link
												to={`/vagas/${job.id}`}
												className="group-hover:text-primary after:absolute after:inset-0 after:rounded-box">
												{job.name}
											</Link>
										</h2>
										{canManage && (
											<div className="relative z-10 -mt-1 -mr-2 flex shrink-0">
												<button
													type="button"
													aria-label={`Editar ${job.name}`}
													onClick={() => openForm(job)}
													className="btn btn-ghost btn-sm btn-square">
													<RiEditLine className="size-4" />
												</button>
												<button
													type="button"
													aria-label={`Remover ${job.name}`}
													onClick={() => setDeleteTarget(job)}
													className="btn btn-ghost btn-sm btn-square text-error">
													<RiDeleteBinLine className="size-4" />
												</button>
											</div>
										)}
									</div>

									<p className="text-base-content/70 line-clamp-2 text-sm leading-6">
										{toPlainText(job.description)}
									</p>

									{skills.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{skills.slice(0, VISIBLE_SKILLS).map((skill) => (
												<Badge
													key={skill.skillId}
													size="sm"
													variant={skill.isRequired ? "primary" : "ghost"}>
													{skill.skillName}
												</Badge>
											))}
											{skills.length > VISIBLE_SKILLS && (
												<Badge size="sm" variant="outline">
													+{skills.length - VISIBLE_SKILLS}
												</Badge>
											)}
										</div>
									)}

									<div className="text-base-content/60 border-base-300 mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
										<span className="flex items-center gap-1">
											<RiMoneyDollarCircleLine className="size-4" />
											{formatCurrency(job.expectedWage)}
										</span>
										<span className="flex items-center gap-1">
											<RiCalendarLine className="size-4" />
											{formatDate(job.createdAt)}
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
