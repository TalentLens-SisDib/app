import {useMemo, useState, type JSX} from "react";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFileList3Line,
} from "@remixicon/react";
import {Alert, Badge, Button, Dialog, RichText, Spinner} from "../ui";
import {toast} from "../ui/toastStore";
import InterviewEditor from "./InterviewEditor";
import {isApiError} from "../../api/errors";
import {useInterviews} from "../../hooks/useInterviews";
import type {CreateInterviewInput, Interview} from "../../types/interview";
import type {Step} from "../../types/step";
import {formatDateTime} from "../../utils/format";
import {toPlainText} from "../../utils/richText";

/** Acima disso a transcrição começa recolhida. */
const LONG_TRANSCRIPT = 360;
const GENERIC_DELETE_ERROR = "Não foi possível remover o registro. Tente novamente.";

type EditorMode = {kind: "create"} | {kind: "edit"; id: string} | null;

export type InterviewsPanelProps = {
	step: Step;
	currentUserId: number;
	/** Nome de quem registrou cada entrevista, por id de usuário. */
	userNames: Map<number, string>;
};

/**
 * Registros de entrevista de uma etapa. Deve ser montado com `key={step.id}`
 * para recomeçar o estado (lista, editor aberto) a cada troca de etapa.
 */
export default function InterviewsPanel({
	step,
	currentUserId,
	userNames,
}: InterviewsPanelProps): JSX.Element {
	const {interviews, loading, error, reload, create, update, remove} = useInterviews(step.id);
	const [editor, setEditor] = useState<EditorMode>(null);
	const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
	const [deleting, setDeleting] = useState(false);

	// O registro do usuário logado vem primeiro; os demais, do mais recente ao mais antigo.
	const sorted = useMemo(
		() =>
			[...interviews].sort((a, b) => {
				if (a.userId === currentUserId) return -1;
				if (b.userId === currentUserId) return 1;
				return b.createdAt.localeCompare(a.createdAt);
			}),
		[interviews, currentUserId],
	);
	const hasOwnInterview = interviews.some((interview) => interview.userId === currentUserId);

	async function handleCreate(data: CreateInterviewInput) {
		await create(data);
		toast.success("Entrevista registrada com sucesso");
		setEditor(null);
	}

	async function handleUpdate(id: string, data: CreateInterviewInput) {
		await update(id, data);
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
				{!loading && !error && !hasOwnInterview && editor?.kind !== "create" && (
					<Button size="sm" className="shrink-0" onClick={() => setEditor({kind: "create"})}>
						<RiAddLine className="size-4" />
						Registrar entrevista
					</Button>
				)}
			</header>

			{editor?.kind === "create" && (
				<InterviewEditor onCancel={() => setEditor(null)} onSubmit={handleCreate} />
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
			) : loading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-12">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando entrevistas...</p>
				</div>
			) : sorted.length === 0 ? (
				editor?.kind !== "create" && (
					<div className="border-base-300 rounded-box flex flex-col items-center gap-3 border border-dashed px-4 py-10 text-center">
						<span className="bg-base-200 text-base-content/50 grid size-11 place-items-center rounded-full">
							<RiFileList3Line className="size-5" />
						</span>
						<div>
							<p className="text-sm font-medium">Nenhuma entrevista registrada nesta etapa</p>
							<p className="text-base-content/60 mt-1 text-sm">
								Registre a transcrição e os pontos-chave logo após a conversa.
							</p>
						</div>
					</div>
				)
			) : (
				<ul className="space-y-3">
					{sorted.map((interview) => (
						<li key={interview.id}>
							{editor?.kind === "edit" && editor.id === interview.id ? (
								<InterviewEditor
									interview={interview}
									onCancel={() => setEditor(null)}
									onSubmit={(data) => handleUpdate(interview.id, data)}
								/>
							) : (
								<InterviewCard
									interview={interview}
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
					Tem certeza que deseja remover seu registro da etapa <strong>{step.name}</strong>? A
					transcrição e os pontos-chave serão perdidos.
				</p>
			</Dialog>
		</section>
	);
}

type InterviewCardProps = {
	interview: Interview;
	authorName: string;
	isOwn: boolean;
	onEdit: () => void;
	onDelete: () => void;
};

function InterviewCard({
	interview,
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
					className={[
						"grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold",
						isOwn ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/70",
					].join(" ")}>
					{authorName.trim().charAt(0).toUpperCase() || "?"}
				</span>
				<div className="min-w-0 flex-1">
					<p className="flex flex-wrap items-center gap-2 text-sm font-medium">
						<span className="truncate">{authorName}</span>
						{isOwn && (
							<Badge size="xs" variant="primary">
								Você
							</Badge>
						)}
					</p>
					<p className="text-base-content/55 text-xs">
						{formatDateTime(interview.createdAt)}
						{edited && ` · editado em ${formatDateTime(interview.updatedAt)}`}
					</p>
				</div>
				{isOwn && (
					<div className="-mt-1 -mr-2 flex shrink-0">
						<button
							type="button"
							aria-label="Editar meu registro"
							onClick={onEdit}
							className="btn btn-ghost btn-sm btn-square">
							<RiEditLine className="size-4" />
						</button>
						<button
							type="button"
							aria-label="Remover meu registro"
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
