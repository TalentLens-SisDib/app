import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiDeleteBinLine, RiEditLine, RiSearchLine, RiStarLine, RiTeamLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {
	Avatar,
	CardGridSkeleton,
	EmptyState,
	ErrorState,
	IconAction,
	ListToolbar,
	SearchInput,
	TagList,
} from "../components/ui";
import {RemoveFromTalentPoolDialog, TalentPoolNoteDialog} from "../components/talentPool/TalentPoolDialogs";
import {useTalentPool} from "../hooks/useTalentPool";
import type {TalentPoolEntry} from "../types/talentPool";
import {formatDate} from "../utils/format";
import {filterTalentPool} from "../utils/talentPool";

const VISIBLE_SKILLS = 4;

type DialogState = {kind: "note" | "remove"; entry: TalentPoolEntry} | null;

export default function TalentPool(): JSX.Element {
	const {entries, loading, error, reload, saveNote, remove} = useTalentPool();
	const [search, setSearch] = useState("");
	const [dialog, setDialog] = useState<DialogState>(null);
	// Remonta o diálogo de nota a cada abertura para partir do texto salvo.
	const [noteKey, setNoteKey] = useState(0);

	const filtered = useMemo(() => filterTalentPool(entries, search), [entries, search]);

	function open(kind: "note" | "remove", entry: TalentPoolEntry) {
		if (kind === "note") setNoteKey((key) => key + 1);
		setDialog({kind, entry});
	}

	const candidatesLink = (
		<Link to="/candidatos" className="btn btn-primary btn-sm font-semibold">
			<RiTeamLine className="size-4" />
			Ver candidatos
		</Link>
	);

	return (
		<>
			<PageHeader
				title="Banco de talentos"
				description="Candidatos promissores guardados para futuras vagas."
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Banco de talentos", href: "/banco-de-talentos"},
				]}
			/>

			<ListToolbar
				count={
					!loading && !error
						? search.trim()
							? `${filtered.length} de ${entries.length} talentos`
							: `${entries.length} ${entries.length === 1 ? "talento" : "talentos"}`
						: undefined
				}>
				<SearchInput
					label="Buscar por nome, competência ou nota"
					value={search}
					onChange={setSearch}
					className="sm:w-80"
				/>
			</ListToolbar>

			{error ? (
				<ErrorState title="Não foi possível carregar o banco de talentos" message={error} onRetry={reload} />
			) : loading ? (
				<CardGridSkeleton label="Carregando banco de talentos" />
			) : entries.length === 0 ? (
				<EmptyState
					icon={<RiStarLine className="size-5" />}
					title="Nenhum candidato no banco de talentos"
					description="Abra o perfil de um candidato promissor e use “Adicionar ao banco de talentos” para guardá-lo para futuras vagas."
					action={candidatesLink}
				/>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={<RiSearchLine className="size-5" />}
					title="Nenhum talento encontrado"
					description={<>Nenhum candidato corresponde a “{search.trim()}”. Tente outro nome, competência ou termo da nota.</>}
					action={
						<button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearch("")}>
							Limpar busca
						</button>
					}
				/>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filtered.map((entry) => (
						<TalentCard
							key={entry.profileId}
							entry={entry}
							onEditNote={() => open("note", entry)}
							onRemove={() => open("remove", entry)}
						/>
					))}
				</ul>
			)}

			<TalentPoolNoteDialog
				key={noteKey}
				open={dialog?.kind === "note"}
				mode="edit"
				candidateName={dialog?.entry.profile.name ?? ""}
				initialNote={dialog?.entry.note}
				onClose={() => setDialog(null)}
				onSubmit={(note) => saveNote(dialog!.entry.profileId, note)}
			/>
			<RemoveFromTalentPoolDialog
				open={dialog?.kind === "remove"}
				candidateName={dialog?.entry.profile.name ?? ""}
				onClose={() => setDialog(null)}
				onConfirm={() => remove(dialog!.entry.profileId)}
			/>
		</>
	);
}

function TalentCard({
	entry,
	onEditNote,
	onRemove,
}: {
	entry: TalentPoolEntry;
	onEditNote: () => void;
	onRemove: () => void;
}): JSX.Element {
	const {profile} = entry;

	return (
		<li className="tl-entity-card group">
			<div className="flex items-start gap-3">
				<Avatar name={profile.name} size="lg" />
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-[0.9375rem] leading-6 font-semibold">
						<Link to={`/candidatos/${profile.id}`} className="hover:text-primary transition-colors">
							{profile.name}
						</Link>
					</h2>
					<p className="text-base-content/55 truncate text-xs">
						Adicionado em {formatDate(entry.addedAt)}
						{entry.addedBy?.name && ` por ${entry.addedBy.name}`}
					</p>
				</div>
				<div className="-mr-2 flex shrink-0">
					<IconAction
						label={`Editar nota de ${profile.name}`}
						icon={<RiEditLine className="size-4" />}
						onClick={onEditNote}
					/>
					<IconAction
						label={`Retirar ${profile.name} do banco de talentos`}
						icon={<RiDeleteBinLine className="size-4" />}
						danger
						onClick={onRemove}
					/>
				</div>
			</div>

			<p className="text-base-content/75 mt-3 line-clamp-3 text-sm leading-5 break-words whitespace-pre-line">
				{entry.note || <span className="text-base-content/40 italic">Sem nota</span>}
			</p>

			{profile.skills.length > 0 && (
				<div className="mt-3">
					<TagList
						max={VISIBLE_SKILLS}
						items={profile.skills.map((skill) => ({id: skill.skillId, label: skill.skillName}))}
					/>
				</div>
			)}
		</li>
	);
}
