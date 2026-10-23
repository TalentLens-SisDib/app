import {useId, useState, type JSX, type KeyboardEvent} from "react";

export type TagInputProps = {
	label?: string;
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	error?: string;
	helperText?: string;
	maxLength?: number;
	disabled?: boolean;
};

/**
 * Campo de lista de textos curtos: Enter adiciona o item, Backspace com o
 * campo vazio remove o último. Itens repetidos são ignorados.
 */
export default function TagInput({
	label,
	value,
	onChange,
	placeholder,
	error,
	helperText,
	maxLength,
	disabled,
}: TagInputProps): JSX.Element {
	const inputId = useId();
	const [draft, setDraft] = useState("");
	const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

	function commit() {
		const item = draft.trim();
		if (!item) return;
		if (!value.includes(item)) onChange([...value, item]);
		setDraft("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			event.preventDefault();
			commit();
		} else if (event.key === "Backspace" && !draft && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	}

	return (
		<div className="ds-field">
			{label && (
				<label htmlFor={inputId} className="ds-field-label">
					{label}
				</label>
			)}
			<div
				className={[
					"input bg-base-100 h-auto min-h-10 w-full flex-wrap gap-1.5 py-1.5",
					error && "input-error",
				]
					.filter(Boolean)
					.join(" ")}>
				{value.map((item, index) => (
					<span key={item} className="badge badge-ghost h-auto max-w-full gap-1 py-0.5 text-left whitespace-normal">
						<span className="min-w-0 break-words">{item}</span>
						<button
							type="button"
							aria-label={`Remover "${item}"`}
							disabled={disabled}
							onClick={() => onChange(value.filter((_, i) => i !== index))}
							className="text-base-content/50 hover:text-base-content shrink-0 cursor-pointer">
							✕
						</button>
					</span>
				))}
				<input
					id={inputId}
					value={draft}
					disabled={disabled}
					maxLength={maxLength}
					placeholder={value.length === 0 ? placeholder : undefined}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={commit}
					className="min-w-32 flex-1"
				/>
			</div>
			{error ? (
				<p id={`${inputId}-error`} role="alert" className="ds-field-note ds-field-note-error">{error}</p>
			) : helperText ? (
				<p id={`${inputId}-helper`} className="ds-field-note ds-field-note-muted">{helperText}</p>
			) : null}
		</div>
	);
}
