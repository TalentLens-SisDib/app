import {useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiDeleteBinLine, RiEditLine, RiStarFill, RiStarLine} from "@remixicon/react";
import {Alert, Badge, Button, Card, Spinner} from "../ui";
import {RemoveFromTalentPoolDialog, TalentPoolNoteDialog} from "./TalentPoolDialogs";
import {useTalentPoolEntry} from "../../hooks/useTalentPool";
import {formatDate} from "../../utils/format";

/** Inclusão, consulta e retirada do candidato no banco de talentos, na página do perfil. */
export default function ProfileTalentPoolCard({profileId, profileName}: {profileId: string; profileName: string}): JSX.Element {
	const {entry, loading, error, reload, save, remove} = useTalentPoolEntry(profileId);
	const [dialog, setDialog] = useState<"note" | "remove" | null>(null);
	// Remonta o diálogo de nota a cada abertura para partir do texto salvo.
	const [noteKey, setNoteKey] = useState(0);

	const open = (kind: "note" | "remove") => {
		if (kind === "note") setNoteKey((value) => value + 1);
		setDialog(kind);
	};
	const close = () => setDialog(null);

	const actions = !loading && !error && (
		entry ? (
			<div className="flex flex-wrap gap-2">
				<Button size="sm" variant="ghost" onClick={() => open("note")}>
					<RiEditLine className="size-4" />
					Editar nota
				</Button>
				<Button size="sm" variant="ghost" onClick={() => open("remove")}>
					<RiDeleteBinLine className="size-4" />
					Retirar
				</Button>
			</div>
		) : (
			<Button size="sm" variant="outline" onClick={() => open("note")}>
				<RiStarLine className="size-4" />
				Adicionar ao banco de talentos
			</Button>
		)
	);

	return (
		<Card
			title="Banco de talentos"
			description={entry ? undefined : "Guarde candidatos promissores para considerar em futuras vagas."}
			actions={actions}>
			{loading ? (
				<div className="flex items-center gap-2 text-sm">
					<Spinner size="sm" />
					<span className="text-base-content/60">Verificando banco de talentos...</span>
				</div>
			) : error ? (
				<Alert variant="error" title="Não foi possível verificar o banco de talentos">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : entry ? (
				<div className="space-y-2">
					<Badge size="sm" variant="warning">
						<RiStarFill className="size-3" aria-hidden />
						No banco de talentos
					</Badge>
					{entry.note ? (
						<p className="break-words whitespace-pre-line leading-7">{entry.note}</p>
					) : (
						<p className="text-base-content/55 text-sm">Nenhuma nota registrada.</p>
					)}
					<p className="text-base-content/55 text-xs">
						Adicionado em {formatDate(entry.addedAt)}
						{entry.addedBy?.name && ` por ${entry.addedBy.name}`} ·{" "}
						<Link to="/banco-de-talentos" className="link link-hover">
							Ver banco de talentos
						</Link>
					</p>
				</div>
			) : (
				<p className="text-base-content/55 text-sm">Este candidato não está no banco de talentos.</p>
			)}

			<TalentPoolNoteDialog
				key={noteKey}
				open={dialog === "note"}
				mode={entry ? "edit" : "add"}
				candidateName={profileName}
				initialNote={entry?.note}
				onClose={close}
				onSubmit={save}
			/>
			<RemoveFromTalentPoolDialog
				open={dialog === "remove"}
				candidateName={profileName}
				onClose={close}
				onConfirm={remove}
			/>
		</Card>
	);
}
