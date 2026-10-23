import {useId, useState, type JSX, type KeyboardEvent} from "react";
import {RiAddLine, RiSearchLine} from "@remixicon/react";
import {isApiError} from "../../api/errors";
import type {Skill} from "../../types/skill";

const MAX_OPTIONS = 8;

type Option = {kind: "skill"; skill: Skill} | {kind: "create"; name: string};

export type SkillPickerProps = {
	/** Catálogo completo — usado para saber se o nome digitado já existe. */
	skills: Skill[];
	/** Ids já adicionados à vaga (não aparecem como opção). */
	selectedIds: Set<string>;
	onSelect: (skill: Skill) => void;
	/** Cria a competência no catálogo; o picker adiciona o resultado em seguida. */
	onCreate: (name: string) => Promise<Skill>;
	disabled?: boolean;
};

/**
 * Busca de competências com criação na hora: se o termo não existe no
 * catálogo, a última opção cria a competência e já a adiciona à vaga.
 */
export default function SkillPicker({
	skills,
	selectedIds,
	onSelect,
	onCreate,
	disabled,
}: SkillPickerProps): JSX.Element {
	const listId = useId();
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [highlight, setHighlight] = useState(0);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const term = query.trim();
	const lowerTerm = term.toLowerCase();
	const exactMatch = skills.find((skill) => skill.name.toLowerCase() === lowerTerm);
	const options: Option[] = skills
		.filter((skill) => !selectedIds.has(skill.id) && skill.name.toLowerCase().includes(lowerTerm))
		.slice(0, MAX_OPTIONS)
		.map((skill) => ({kind: "skill", skill}));
	if (term && !exactMatch) options.push({kind: "create", name: term});

	const showList = open && (options.length > 0 || Boolean(term));
	const activeIndex = Math.min(highlight, options.length - 1);

	async function choose(option: Option) {
		setError(null);
		if (option.kind === "skill") {
			onSelect(option.skill);
		} else {
			setCreating(true);
			try {
				onSelect(await onCreate(option.name));
			} catch (err) {
				setError(
					isApiError(err) && err.status === 409
						? "Já existe uma competência com esse nome."
						: "Não foi possível criar a competência.",
				);
				return;
			} finally {
				setCreating(false);
			}
		}
		setQuery("");
		setHighlight(0);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setOpen(true);
			setHighlight((index) => Math.min(index + 1, options.length - 1));
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setHighlight((index) => Math.max(index - 1, 0));
		} else if (event.key === "Enter") {
			// Sempre impede o submit do formulário da vaga.
			event.preventDefault();
			const option = options[activeIndex];
			if (showList && option && !creating) void choose(option);
		} else if (event.key === "Escape" && showList) {
			// Fecha só a lista, sem fechar o modal.
			event.preventDefault();
			event.stopPropagation();
			setOpen(false);
		}
	}

	return (
		<div className="ds-field">
			<label className="input bg-base-100 w-full">
				<RiSearchLine className="text-base-content/45 size-4 shrink-0" />
				<input
					role="combobox"
					aria-label="Buscar ou criar competência"
					aria-expanded={showList}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={showList && options.length > 0 ? `${listId}-${activeIndex}` : undefined}
					placeholder="Buscar ou criar competência..."
					disabled={disabled || creating}
					value={query}
					maxLength={100}
					onChange={(event) => {
						setQuery(event.target.value);
						setHighlight(0);
						setOpen(true);
						setError(null);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					onKeyDown={handleKeyDown}
				/>
				{creating && <span className="loading loading-spinner loading-xs" aria-hidden="true" />}
			</label>

			{showList && (
				// Lista em fluxo (não flutuante) para não ser cortada pelo scroll do modal.
				<ul
					id={listId}
					role="listbox"
					aria-label="Competências"
					className="border-base-300 bg-base-100 rounded-field mt-1.5 max-h-56 overflow-y-auto border p-1 shadow-sm">
					{options.length === 0 ? (
						<li className="text-base-content/60 px-3 py-2 text-sm">
							“{exactMatch?.name}” já foi adicionada.
						</li>
					) : (
						options.map((option, index) => (
							<li
								key={option.kind === "skill" ? option.skill.id : "create"}
								id={`${listId}-${index}`}
								role="option"
								aria-selected={index === activeIndex}
								// mousedown para escolher antes do blur fechar a lista.
								onMouseDown={(event) => {
									event.preventDefault();
									void choose(option);
								}}
								onMouseEnter={() => setHighlight(index)}
								className={[
									"rounded-field flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
									index === activeIndex && "bg-base-200",
								]
									.filter(Boolean)
									.join(" ")}>
								{option.kind === "skill" ? (
									<span className="truncate">{option.skill.name}</span>
								) : (
									<>
										<RiAddLine className="text-primary size-4 shrink-0" />
										<span className="truncate">
											Criar <strong>“{option.name}”</strong>
										</span>
									</>
								)}
							</li>
						))
					)}
				</ul>
			)}

			{error && (
				<p role="alert" className="ds-field-note ds-field-note-error">
					{error}
				</p>
			)}
		</div>
	);
}
