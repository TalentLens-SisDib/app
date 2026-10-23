import {useMemo, useState, type JSX, type ReactNode} from "react";
import {Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {
	RiAddLine,
	RiArrowLeftLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFileTextLine,
	RiFlowChart,
} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import InterviewsPanel from "../components/jobOpenings/InterviewsPanel";
import JobOpeningFormDialog from "../components/jobOpenings/JobOpeningFormDialog";
import JobOverviewPanel from "../components/jobOpenings/JobOverviewPanel";
import StepFormDialog from "../components/jobOpenings/StepFormDialog";
import {Alert, Button, Card, Dialog, Spinner} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {isApiError} from "../api/errors";
import {useJobOpening} from "../hooks/useJobOpening";
import {useSession} from "../hooks/useSession";
import {useUsers} from "../hooks/useUsers";
import type {CreateJobOpeningInput} from "../types/jobOpening";
import type {CreateStepInput, Step} from "../types/step";
import {canManageJobOpening} from "../utils/permissions";

const STEP_PARAM = "etapa";
const GENERIC_DELETE_JOB_ERROR = "Não foi possível remover a vaga. Tente novamente.";
const GENERIC_DELETE_STEP_ERROR = "Não foi possível remover a etapa. Tente novamente.";

export default function JobOpeningDetail(): JSX.Element {
	const {id = ""} = useParams();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const session = useSession();
	const {users} = useUsers();
	const {
		jobOpening,
		steps,
		loading,
		error,
		notFound,
		reload,
		update,
		remove,
		addStep,
		editStep,
		removeStep,
	} = useJobOpening(id);

	const [jobFormOpen, setJobFormOpen] = useState(false);
	const [jobFormKey, setJobFormKey] = useState(0);
	const [deleteJobOpen, setDeleteJobOpen] = useState(false);
	const [deletingJob, setDeletingJob] = useState(false);

	const [stepFormOpen, setStepFormOpen] = useState(false);
	const [stepFormKey, setStepFormKey] = useState(0);
	const [editingStep, setEditingStep] = useState<Step | null>(null);
	const [deleteStepTarget, setDeleteStepTarget] = useState<Step | null>(null);
	const [deletingStep, setDeletingStep] = useState(false);

	const userNames = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

	// Seção ativa vem da URL: `?etapa=<id>` abre a etapa; sem ele (ou inválido), "Sobre a vaga".
	const selectedStep = steps.find((step) => step.id === searchParams.get(STEP_PARAM)) ?? null;
	const nextOrder = steps.reduce((max, step) => Math.max(max, step.order), 0) + 1;

	function selectSection(stepId: string | null) {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (stepId) next.set(STEP_PARAM, stepId);
				else next.delete(STEP_PARAM);
				return next;
			},
			{replace: true},
		);
	}

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-24">
				<Spinner />
				<p className="text-base-content/60 text-sm">Carregando vaga...</p>
			</div>
		);
	}

	if (notFound || (!error && !jobOpening)) {
		return (
			<Card>
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<p className="font-medium">Vaga não encontrada</p>
					<p className="text-base-content/60 text-sm">
						Ela pode ter sido removida ou o link está incorreto.
					</p>
					<Link to="/vagas" className="btn btn-sm btn-ghost">
						<RiArrowLeftLine className="size-4" />
						Voltar para vagas
					</Link>
				</div>
			</Card>
		);
	}

	if (error || !jobOpening) {
		return (
			<Alert variant="error" title="Não foi possível carregar a vaga">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span>{error}</span>
					<Button size="xs" variant="ghost" onClick={reload}>
						Tentar novamente
					</Button>
				</div>
			</Alert>
		);
	}

	const canManage = canManageJobOpening(session?.user, jobOpening);

	function openStepForm(step: Step | null) {
		setEditingStep(step);
		setStepFormKey((key) => key + 1);
		setStepFormOpen(true);
	}

	async function handleJobSubmit(data: CreateJobOpeningInput) {
		await update(data);
		toast.success("Vaga atualizada com sucesso");
	}

	async function handleStepSubmit(data: CreateStepInput) {
		if (editingStep) {
			await editStep(editingStep.id, data);
			toast.success("Etapa atualizada com sucesso");
		} else {
			const step = await addStep(data);
			selectSection(step.id);
			toast.success("Etapa criada com sucesso");
		}
	}

	async function confirmDeleteJob() {
		setDeletingJob(true);
		try {
			await remove();
			toast.success("Vaga removida com sucesso");
			navigate("/vagas", {replace: true});
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_JOB_ERROR);
			setDeletingJob(false);
		}
	}

	async function confirmDeleteStep() {
		if (!deleteStepTarget) return;
		setDeletingStep(true);
		try {
			await removeStep(deleteStepTarget.id);
			toast.success("Etapa removida com sucesso");
			setDeleteStepTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_STEP_ERROR);
		} finally {
			setDeletingStep(false);
		}
	}

	return (
		<>
			<PageHeader
				title={jobOpening.name}
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Vagas", href: "/vagas"},
					{label: jobOpening.name, href: `/vagas/${jobOpening.id}`},
				]}
				actions={
					canManage && (
						<>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setJobFormKey((key) => key + 1);
									setJobFormOpen(true);
								}}>
								<RiEditLine className="size-4" />
								Editar
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="text-error"
								onClick={() => setDeleteJobOpen(true)}>
								<RiDeleteBinLine className="size-4" />
								Remover
							</Button>
						</>
					)
				}
			/>

			<div className="grid items-start gap-6 lg:grid-cols-[17rem_1fr]">
				<nav aria-label="Seções da vaga" className="min-w-0 lg:sticky lg:top-20">
					{/* Mobile: faixa horizontal com rolagem; desktop: lista vertical fixa ao lado. */}
					<ol className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
						<li className="w-48 shrink-0 snap-start lg:w-auto">
							<SectionButton
								active={selectedStep === null}
								onClick={() => selectSection(null)}
								marker={<RiFileTextLine className="size-3.5" />}
								label="Sobre a vaga"
							/>
						</li>

						<li
							aria-hidden="true"
							className="text-base-content/55 hidden px-1 pt-4 pb-1 text-xs font-semibold tracking-wider uppercase lg:block">
							Etapas do processo
						</li>

						{steps.map((step) => (
							<li key={step.id} className="group relative w-60 shrink-0 snap-start lg:w-auto">
								<SectionButton
									active={step.id === selectedStep?.id}
									onClick={() => selectSection(step.id)}
									marker={step.order}
									label={step.name}
									withActions={canManage}
								/>
								{canManage && (
									<div className="absolute inset-y-0 right-1.5 flex items-center opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
										<button
											type="button"
											aria-label={`Editar etapa ${step.name}`}
											onClick={() => openStepForm(step)}
											className="btn btn-ghost btn-xs btn-square">
											<RiEditLine className="size-3.5" />
										</button>
										<button
											type="button"
											aria-label={`Remover etapa ${step.name}`}
											onClick={() => setDeleteStepTarget(step)}
											className="btn btn-ghost btn-xs btn-square text-error">
											<RiDeleteBinLine className="size-3.5" />
										</button>
									</div>
								)}
							</li>
						))}

						{canManage ? (
							<li className="shrink-0 snap-start lg:w-auto">
								<button
									type="button"
									onClick={() => openStepForm(null)}
									className="rounded-box border-base-300 text-base-content/60 hover:border-primary/40 hover:text-primary flex h-full w-full cursor-pointer items-center gap-2 border border-dashed px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors">
									<RiAddLine className="size-4" />
									Nova etapa
								</button>
							</li>
						) : (
							steps.length === 0 && (
								<li className="text-base-content/60 hidden px-1 text-sm lg:block">
									Nenhuma etapa cadastrada.
								</li>
							)
						)}
					</ol>
				</nav>

				<Card padding="md" className="min-w-0">
					{selectedStep && session ? (
						<InterviewsPanel
							key={selectedStep.id}
							step={selectedStep}
							currentUserId={session.user.id}
							userNames={userNames}
						/>
					) : (
						<>
							<JobOverviewPanel
								jobOpening={jobOpening}
								ownerName={userNames.get(jobOpening.userId) ?? `Usuário #${jobOpening.userId}`}
							/>
							{steps.length === 0 && canManage && (
								<div className="bg-primary/5 border-primary/15 rounded-box mt-6 flex flex-col items-start gap-3 border p-4 sm:flex-row sm:items-center">
									<RiFlowChart className="text-primary size-5 shrink-0" />
									<p className="text-base-content/70 flex-1 text-sm">
										Monte o processo seletivo: crie as etapas (triagem, entrevista técnica...)
										para registrar as entrevistas de cada uma.
									</p>
									<Button size="sm" onClick={() => openStepForm(null)}>
										<RiAddLine className="size-4" />
										Criar primeira etapa
									</Button>
								</div>
							)}
						</>
					)}
				</Card>
			</div>

			<JobOpeningFormDialog
				key={`job-${jobFormKey}`}
				open={jobFormOpen}
				onClose={() => setJobFormOpen(false)}
				jobOpening={jobOpening}
				onSubmit={handleJobSubmit}
			/>

			<StepFormDialog
				key={`step-${stepFormKey}`}
				open={stepFormOpen}
				onClose={() => setStepFormOpen(false)}
				step={editingStep}
				nextOrder={nextOrder}
				takenOrders={steps.filter((step) => step.id !== editingStep?.id).map((step) => step.order)}
				onSubmit={handleStepSubmit}
			/>

			<Dialog
				open={deleteJobOpen}
				onClose={() => !deletingJob && setDeleteJobOpen(false)}
				title="Remover vaga?"
				actions={
					<>
						<Button variant="ghost" disabled={deletingJob} onClick={() => setDeleteJobOpen(false)}>
							Cancelar
						</Button>
						<Button variant="error" loading={deletingJob} onClick={confirmDeleteJob}>
							Remover
						</Button>
					</>
				}>
				<p>
					Tem certeza que deseja remover <strong>{jobOpening.name}</strong>? As etapas e os
					registros de entrevista dessa vaga também serão removidos. Essa ação não poderá ser
					desfeita.
				</p>
			</Dialog>

			<Dialog
				open={deleteStepTarget !== null}
				onClose={() => !deletingStep && setDeleteStepTarget(null)}
				title="Remover etapa?"
				actions={
					<>
						<Button variant="ghost" disabled={deletingStep} onClick={() => setDeleteStepTarget(null)}>
							Cancelar
						</Button>
						<Button variant="error" loading={deletingStep} onClick={confirmDeleteStep}>
							Remover
						</Button>
					</>
				}>
				<p>
					Tem certeza que deseja remover a etapa <strong>{deleteStepTarget?.name}</strong>? Todos os
					registros de entrevista dela também serão removidos. Essa ação não poderá ser desfeita.
				</p>
			</Dialog>
		</>
	);
}

type SectionButtonProps = {
	active: boolean;
	onClick: () => void;
	/** Número da etapa ou ícone, dentro do círculo à esquerda. */
	marker: ReactNode;
	label: string;
	/** Reserva espaço à direita para os botões de editar/remover. */
	withActions?: boolean;
};

function SectionButton({active, onClick, marker, label, withActions}: SectionButtonProps): JSX.Element {
	return (
		<button
			type="button"
			aria-current={active ? "page" : undefined}
			onClick={onClick}
			className={[
				"rounded-box flex w-full cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-colors",
				withActions && "pr-16",
				active
					? "border-primary/30 bg-primary/8 text-base-content"
					: "border-base-300 bg-base-100 hover:border-primary/30",
			]
				.filter(Boolean)
				.join(" ")}>
			<span
				className={[
					"grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
					active ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/70",
				].join(" ")}>
				{marker}
			</span>
			<span className="min-w-0 truncate text-sm font-medium">{label}</span>
		</button>
	);
}
