import {useRef, useState, type DragEvent, type SubmitEvent, type JSX} from "react";
import {RiUploadCloud2Line} from "@remixicon/react";
import {Alert, Button, RichTextEditor, TagInput} from "../ui";
import {toast} from "../ui/toastStore";
import {isApiError} from "../../api/errors";
import type {CreateInterviewInput, Interview} from "../../types/interview";
import {
	importTranscript,
	TRANSCRIPT_ACCEPT,
	TRANSCRIPT_EXTENSIONS,
	TranscriptImportError,
} from "../../utils/transcriptImport";

const TAKEAWAY_MAX_LENGTH = 255;
const GENERIC_FORM_ERROR = "Não foi possível salvar o registro. Tente novamente.";

export type InterviewEditorProps = {
	/** Registro em edição; ausente para um registro novo. */
	interview?: Interview;
	onCancel: () => void;
	onSubmit: (data: CreateInterviewInput) => Promise<unknown>;
};

function hasFiles(event: DragEvent): boolean {
	return Array.from(event.dataTransfer.types).includes("Files");
}

/** Formulário inline do registro de entrevista — abre no próprio painel da etapa. */
export default function InterviewEditor({
	interview,
	onCancel,
	onSubmit,
}: InterviewEditorProps): JSX.Element {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [transcript, setTranscript] = useState(interview?.transcript ?? "");
	const [keyTakeaways, setKeyTakeaways] = useState<string[]>(interview?.keyTakeaways ?? []);
	const [transcriptError, setTranscriptError] = useState<string | undefined>();
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [dragging, setDragging] = useState(false);

	async function handleImport(file: File) {
		if (importing) return;
		setImporting(true);
		try {
			const html = await importTranscript(file);
			const replaced = Boolean(transcript);
			setTranscript(html);
			setTranscriptError(undefined);
			toast.success(
				replaced
					? `Transcrição substituída por “${file.name}”. Use Ctrl+Z no editor para desfazer.`
					: `Transcrição importada de “${file.name}”.`,
				replaced ? 6000 : undefined,
			);
		} catch (err) {
			toast.error(
				err instanceof TranscriptImportError ? err.message : "Não foi possível importar o arquivo.",
			);
		} finally {
			setImporting(false);
		}
	}

	// Captura antes do Tiptap: arquivo solto vira importação, não texto colado.
	function handleDrop(event: DragEvent<HTMLDivElement>) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		event.stopPropagation();
		setDragging(false);
		const file = event.dataTransfer.files[0];
		if (file) void handleImport(file);
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const nextTranscriptError = transcript
			? undefined
			: "Registre a transcrição ou as anotações da entrevista.";
		setTranscriptError(nextTranscriptError);
		setFormError(null);
		if (nextTranscriptError) return;

		setSubmitting(true);
		try {
			await onSubmit({transcript, keyTakeaways});
		} catch (err) {
			setFormError(isApiError(err) ? err.message : GENERIC_FORM_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form
			noValidate
			onSubmit={handleSubmit}
			className="border-primary/25 bg-base-100 rounded-box space-y-4 border p-4 shadow-sm sm:p-5">
			<p className="text-sm font-semibold">
				{interview ? "Editar meu registro" : "Novo registro de entrevista"}
			</p>

			{formError && (
				<Alert variant="error" title="Não foi possível salvar">
					{formError}
				</Alert>
			)}

			<div
				className="relative"
				onDragEnterCapture={(event) => hasFiles(event) && setDragging(true)}
				onDragOverCapture={(event) => {
					if (hasFiles(event)) event.preventDefault();
				}}
				onDragLeaveCapture={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
				}}
				onDropCapture={handleDrop}>
				<RichTextEditor
					label="Transcrição / anotações"
					required
					minHeightClass="min-h-48"
					placeholder="Cole ou importe a transcrição, ou descreva como foi a conversa com o candidato..."
					value={transcript}
					onChange={setTranscript}
					error={transcriptError}
					disabled={submitting || importing}
					helperText={`Importe ${TRANSCRIPT_EXTENSIONS.join(", ")} pelo botão ou arrastando o arquivo para cá.`}
					labelAction={
						<Button
							variant="ghost"
							size="xs"
							loading={importing}
							disabled={submitting}
							onClick={() => fileInputRef.current?.click()}>
							{!importing && <RiUploadCloud2Line className="size-4" />}
							Importar arquivo
						</Button>
					}
				/>

				{dragging && (
					<div className="border-primary bg-primary/10 text-primary rounded-field pointer-events-none absolute inset-0 grid place-items-center border-2 border-dashed text-sm font-semibold">
						<span className="flex items-center gap-2">
							<RiUploadCloud2Line className="size-5" />
							Solte para importar a transcrição
						</span>
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept={TRANSCRIPT_ACCEPT}
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0];
						// Limpa para permitir importar o mesmo arquivo de novo.
						event.target.value = "";
						if (file) void handleImport(file);
					}}
				/>
			</div>

			<TagInput
				label="Pontos-chave"
				value={keyTakeaways}
				onChange={setKeyTakeaways}
				maxLength={TAKEAWAY_MAX_LENGTH}
				disabled={submitting}
				placeholder="Ex.: Domina React; precisa evoluir em testes"
				helperText="Pressione Enter para adicionar cada ponto (até 255 caracteres)."
			/>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button variant="ghost" size="sm" disabled={submitting} onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" size="sm" loading={submitting}>
					{interview ? "Salvar alterações" : "Salvar registro"}
				</Button>
			</div>
		</form>
	);
}
