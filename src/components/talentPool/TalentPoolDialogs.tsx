import {useState, type JSX} from "react";
import {Button, Dialog, Textarea} from "../ui";
import {toast} from "../ui/toastStore";
import {isApiError} from "../../api/errors";
import {TALENT_POOL_NOTE_MAX, validateTalentPoolNote} from "../../utils/talentPool";

const GENERIC_SAVE_ERROR = "Não foi possível salvar no banco de talentos. Tente novamente.";
const GENERIC_REMOVE_ERROR = "Não foi possível retirar do banco de talentos. Tente novamente.";

export type TalentPoolNoteDialogProps = {
	open: boolean;
	/** `add` inclui o candidato; `edit` só troca a nota. */
	mode: "add" | "edit";
	candidateName: string;
	initialNote?: string | null;
	onClose: () => void;
	onSubmit: (note: string | null) => Promise<unknown>;
};

/**
 * Inclusão no banco de talentos ou edição da nota. Monte com `key` diferente a
 * cada abertura para começar com o texto atual.
 */
export function TalentPoolNoteDialog({
	open,
	mode,
	candidateName,
	initialNote,
	onClose,
	onSubmit,
}: TalentPoolNoteDialogProps): JSX.Element {
	const [note, setNote] = useState(initialNote ?? "");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function submit() {
		const result = validateTalentPoolNote(note);
		if (!result.ok) {
			setError(result.error);
			return;
		}
		setSaving(true);
		try {
			await onSubmit(result.note);
			toast.success(
				mode === "add" ? `${candidateName} adicionado(a) ao banco de talentos` : "Nota do banco de talentos atualizada",
			);
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_SAVE_ERROR);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={() => !saving && onClose()}
			title={mode === "add" ? "Adicionar ao banco de talentos" : "Editar nota"}
			actions={
				<>
					<Button variant="ghost" disabled={saving} onClick={onClose}>
						Cancelar
					</Button>
					<Button loading={saving} onClick={submit}>
						{mode === "add" ? "Adicionar" : "Salvar nota"}
					</Button>
				</>
			}>
			<form
				noValidate
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					if (!saving) void submit();
				}}>
				{mode === "add" && (
					<p>
						<strong>{candidateName}</strong> ficará disponível no banco de talentos para ser considerado(a)
						em futuras vagas.
					</p>
				)}
				<Textarea
					label="Por que este candidato é promissor?"
					rows={4}
					maxLength={TALENT_POOL_NOTE_MAX}
					value={note}
					error={error ?? undefined}
					disabled={saving}
					placeholder="Ex.: ótima entrevista técnica, perfil para vagas de liderança"
					helperText={`${note.length}/${TALENT_POOL_NOTE_MAX} caracteres · opcional`}
					onChange={(event) => {
						setNote(event.target.value);
						setError(null);
					}}
				/>
			</form>
		</Dialog>
	);
}

export type RemoveFromTalentPoolDialogProps = {
	open: boolean;
	candidateName: string;
	onClose: () => void;
	onConfirm: () => Promise<void>;
};

export function RemoveFromTalentPoolDialog({
	open,
	candidateName,
	onClose,
	onConfirm,
}: RemoveFromTalentPoolDialogProps): JSX.Element {
	const [removing, setRemoving] = useState(false);

	async function confirm() {
		setRemoving(true);
		try {
			await onConfirm();
			toast.success(`${candidateName} retirado(a) do banco de talentos`);
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_REMOVE_ERROR);
		} finally {
			setRemoving(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={() => !removing && onClose()}
			title="Retirar do banco de talentos?"
			actions={
				<>
					<Button variant="ghost" disabled={removing} onClick={onClose}>
						Cancelar
					</Button>
					<Button variant="error" loading={removing} onClick={confirm}>
						Retirar
					</Button>
				</>
			}>
			<p>
				<strong>{candidateName}</strong> sai do banco de talentos e a nota registrada é descartada. O perfil
				do candidato e as candidaturas continuam como estão.
			</p>
		</Dialog>
	);
}
