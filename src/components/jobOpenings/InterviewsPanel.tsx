import {useMemo, useState, type JSX, type ReactNode} from "react";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFileList3Line,
	RiTeamLine,
} from "@remixicon/react";
import {Alert, Badge, Button, Dialog, RichText, Spinner} from "../ui";
import {toast} from "../ui/toastStore";
import InterviewEditor, {type InterviewCandidate} from "./InterviewEditor";
import {isApiError} from "../../api/errors";
import {useInterviews} from "../../hooks/useInterviews";
import type {CreateInterviewInput, Interview} from "../../types/interview";
import type {Step} from "../../types/step";
import {formatDateTime} from "../../utils/format";
import {toPlainText} from "../../utils/richText";

/** Acima disso a transcrição começa recolhida. */
const LONG_TRANSCRIPT = 360;
const GENERIC_DELETE_ERROR = "Não foi possível remover o registro. Tente novamente.";
const REMOVED_CANDIDATE = "Candidato removido da vaga";

type EditorMode = {kind: "create"} | {kind: "edit"; id: string} | null;

export type InterviewsPanelProps = {
	step: Step;
	currentUserId: number;
	/** Nome de quem registrou cada entrevista, por id de usuário. */
	userNames: Map<number, string>;
	/** Candidatos vinculados à vaga — quem pode ser entrevistado. */
	candidates: InterviewCandidate[];
	candidatesLoading: boolean;
	/** Leva à seção de candidatos da vaga (estado vazio). */
	onGoToCandidates: () => void;
};

/**
 * Registros de entrevista de uma etapa: vários por candidato e por
 * entrevistador. Deve ser montado com `key={step.id}` para recomeçar o
 * estado (lista, filtro, editor aberto) a cada troca de etapa.
 */
export default function InterviewsPanel({
	step,
	currentUserId,
	userNames,
	candidates,
	candidatesLoading,
	onGoToCandidates,
}: InterviewsPanelProps): JSX.Element {
	const {interviews, loading, error, reload, create, update, remove} = useInterviews(step.id);
	const [editor, setEditor] = useState<EditorMode>(null);
	const [filter, setFilter] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
	const [deleting, setDeleting] = useState(false);

	const candidateNames = useMemo(
		() => new Map(candidates.map((candidate) => [candidate.id, candidate.name])),
		[candidates],
	);
	const nameOf = (profileId: string) => candidateNames.get(profileId) ?? REMOVED_CANDIDATE;

	const countByCandidate = useMemo(() => {
		const counts = new Map<string, number>();
		for (const interview of interviews)
			counts.set(interview.profileId, (counts.get(interview.profileId) ?? 0) + 1);
		return counts;
	}, [interviews]);

	// Filtro por candidato; da entrevista mais recente para a mais antiga.
	const visible = useMemo(
		() =>
			interviews
				.filter((interview) => !filter || interview.profileId === filter)
				.sort((a, b) => b.startDate.localeCompare(a.startDate)),
		[interviews, filter],
	);

	async function handleCreate(data: CreateInterviewInput) {
		await create(data);
		toast.success(`Entrevista com ${nameOf(data.profileId)} registrada`);
		setEditor(null);
	}

	async function handleUpdate(id: string, data: CreateInterviewInput) {
		const {transcript, keyTakeaways, startDate} = data;
		await update(id, {transcript, keyTakeaways, startDate});
		toast.success("Registro atualizado com sucesso");
		setEditor(null);
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await remove(deleteTarget.id);
			toast.success("Registro removido com sucesso");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_ERROR);
		} finally {
			setDeleting(false);
		}
	}

	const busy = loading || candidatesLoading;
	const canRegister = candidates.length > 0;

	return (
		<section aria-labelledby={`step-${step.id}-title`} className="space-y-4">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="text-primary text-xs font-semibold tracking-wider uppercase">
						Etapa {step.order}
					</p>
					<h2 id={`step-${step.id}-title`} className="mt-0.5 text-lg font-semibold">
						{step.name}
					</h2>
					{step.description && (
						<RichText value={step.description} className="text-base-content/70 mt-2 text-sm" />
					)}
				</div>
				{!busy && !error && canRegister && editor?.kind !== "create" && (
					<Button size="sm" className="shrink-0" onClick={() => setEditor({kind: "create"})}>
						<RiAddLine className="size-4" />
						Registrar entrevista
					</Button>
				)}
			</header>

			{/* Filtro por candidato: só aparece quando há registros de mais de um. */}
			{!busy && !error && countByCandidate.size > 1 && (
				<div role="group" aria-label="Filtrar por candidato" className="flex flex-wrap gap-1.5">
					<FilterChip active={filter === null} onClick={() => setFilter(null)}>
						Todos <span className="tabular-nums opacity-70">{interviews.length}</span>
					</FilterChip>
					{[...countByCandidate].map(([profileId, count]) => (
						<FilterChip key={profileId} active={filter === profileId} onClick={() => setFilter(profileId)}>
							{nameOf(profileId)} <span className="tabular-nums opacity-70">{count}</span>
						</FilterChip>
					))}
				</div>
			)}

			{editor?.kind === "create" && (
				<InterviewEditor
					candidates={candidates}
					defaultProfileId={filter ?? undefined}
					onCancel={() => setEditor(null)}
					onSubmit={handleCreate}
				/>
			)}

			{error ? (
				<Alert variant="error" title="Não foi possível carregar as entrevistas">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : busy ? (
				<div className="flex flex-col items-center justify-center gap-3 py-12">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando entrevistas...</p>
				</div>
			) : !canRegister && interviews.length === 0 ? (
				<div className="border-base-300 rounded-box flex flex-col items-center gap-3 border border-dashed px-4 py-10 text-center">
					<span className="bg-base-200 text-base-content/50 grid size-11 place-items-center rounded-full">
						<RiTeamLine className="size-5" />
					</span>
					<div>
						<p className="text-sm font-medium">A vaga ainda não tem candidatos</p>
						<p className="text-base-content/60 mt-1 text-sm">
							Vincule candidatos à vaga para registrar as entrevistas desta etapa.
						</p>
					</div>
					<Button size="sm" variant="outline" onClick={onGoToCandidates}>
						Ver candidatos da vaga
					</Button>
				</div>
			) : visible.length === 0 ? (
				editor?.kind !== "create" && (
					<div className="border-base-300 rounded-box flex flex-col items-center gap-3 border border-dashed px-4 py-10 text-center">
						<span className="bg-base-200 text-base-content/50 grid size-11 place-items-center rounded-full">
							<RiFileList3Line className="size-5" />
						</span>
						<div>
							<p className="text-sm font-medium">Nenhuma entrevista registrada nesta etapa</p>
							<p className="text-base-content/60 mt-1 text-sm">
								Registre a transcrição e os pontos-chave logo após a conversa com cada candidato.
							</p>
						</div>
					</div>
				)
			) : (
				<ul className="space-y-3">
					{visible.map((interview) => (
						<li key={interview.id}>
							{editor?.kind === "edit" && editor.id === interview.id ? (
								<InterviewEditor
									interview={interview}
									candidates={candidates}
									onCancel={() => setEditor(null)}
									onSubmit={(data) => handleUpdate(interview.id, data)}
								/>
							) : (
								<InterviewCard
									interview={interview}
									candidateName={nameOf(interview.profileId)}
									authorName={userNames.get(interview.userId) ?? `Usuário #${interview.userId}`}
									isOwn={interview.userId === currentUserId}
									onEdit={() => setEditor({kind: "edit", id: interview.id})}
									onDelete={() => setDeleteTarget(interview)}
								/>
							)}
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={deleteTarget !== null}
				onClose={() => !deleting && setDeleteTarget(null)}
				title="Remover registro?"
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
					Tem certeza que deseja remover seu registro da entrevista com{" "}
					<strong>{deleteTarget ? nameOf(deleteTarget.profileId) : ""}</strong> de{" "}
					<strong>{deleteTarget ? formatDateTime(deleteTarget.startDate) : ""}</strong>? A
					transcrição e os pontos-chave serão perdidos.
				</p>
			</Dialog>
		</section>
	);
}

function FilterChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}): JSX.Element {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={[
				"cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
				active
					? "border-primary/30 bg-primary/10 text-primary"
					: "border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30",
			].join(" ")}>
			{children}
		</button>
	);
}

type InterviewCardProps = {
	interview: Interview;
	candidateName: string;
	authorName: string;
	isOwn: boolean;
	onEdit: () => void;
	onDelete: () => void;
};

function InterviewCard({
	interview,
	candidateName,
	authorName,
	isOwn,
	onEdit,
	onDelete,
}: InterviewCardProps): JSX.Element {
	const isLong = toPlainText(interview.transcript).length > LONG_TRANSCRIPT;
	const [expanded, setExpanded] = useState(!isLong);
	const edited = interview.updatedAt !== interview.createdAt;

	return (
		<article
			className={[
				"bg-base-100 rounded-box border p-4 shadow-sm sm:p-5",
				isOwn ? "border-primary/25" : "border-base-300",
			].join(" ")}>
			<header className="flex items-start gap-3">
				<span
					aria-hidden="true"
					className="bg-base-200 text-base-content/70 grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
					{candidateName.trim().charAt(0).toUpperCase() || "?"}
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold">{candidateName}</p>
					<p className="text-base-content/55 flex flex-wrap items-center gap-x-1.5 text-xs">
						<span>
							{formatDateTime(interview.startDate)} · por{" "}
							<span className="text-base-content/75 font-medium">{authorName}</span>
						</span>
						{isOwn && (
							<Badge size="xs" variant="primary">
								Você
							</Badge>
						)}
						{edited && <span>· editado em {formatDateTime(interview.updatedAt)}</span>}
					</p>
				</div>
				{isOwn && (
					<div className="-mt-1 -mr-2 flex shrink-0">
						<button
							type="button"
							aria-label={`Editar registro de ${candidateName}`}
							onClick={onEdit}
							className="btn btn-ghost btn-sm btn-square">
							<RiEditLine className="size-4" />
						</button>
						<button
							type="button"
							aria-label={`Remover registro de ${candidateName}`}
							onClick={onDelete}
							className="btn btn-ghost btn-sm btn-square text-error">
							<RiDeleteBinLine className="size-4" />
						</button>
					</div>
				)}
			</header>

			{interview.keyTakeaways.length > 0 && (
				<ul className="mt-4 grid gap-1.5" aria-label="Pontos-chave">
					{interview.keyTakeaways.map((takeaway) => (
						<li key={takeaway} className="flex items-start gap-2 text-sm leading-5">
							<RiCheckLine className="text-success mt-0.5 size-4 shrink-0" />
							<span className="min-w-0 break-words">{takeaway}</span>
						</li>
					))}
				</ul>
			)}

			<div className="bg-base-200 rounded-field mt-4 px-3 py-2.5">
				<p className="text-base-content/55 mb-1 text-xs font-semibold tracking-wide uppercase">
					Transcrição
				</p>
				{/* Rich text não funciona com line-clamp: recolhe por altura, com degradê no fim. */}
				<div className={["relative", !expanded && "max-h-28 overflow-hidden"].filter(Boolean).join(" ")}>
					<RichText value={interview.transcript} className="text-sm" />
					{!expanded && (
						<div
							aria-hidden="true"
							className="from-base-200 pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent"
						/>
					)}
				</div>
				{isLong && (
					<button
						type="button"
						aria-expanded={expanded}
						onClick={() => setExpanded((value) => !value)}
						className="text-primary mt-1 inline-flex cursor-pointer items-center gap-0.5 text-xs font-medium hover:underline">
						{expanded ? "Mostrar menos" : "Mostrar transcrição completa"}
						<RiArrowDownSLine
							className={["size-4 transition-transform", expanded && "rotate-180"]
								.filter(Boolean)
								.join(" ")}
						/>
					</button>
				)}
			</div>
		</article>
	);
}
