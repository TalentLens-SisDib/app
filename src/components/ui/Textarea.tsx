import {useId, type JSX, type TextareaHTMLAttributes} from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label?: string;
	error?: string;
	helperText?: string;
};

export default function Textarea({
	label,
	error,
	helperText,
	id,
	required,
	className,
	...rest
}: TextareaProps): JSX.Element {
	const generatedId = useId();
	const textareaId = id ?? generatedId;
	const describedBy = error
		? `${textareaId}-error`
		: helperText
			? `${textareaId}-helper`
			: undefined;

	return (
		<div className="ds-field">
			{label && (
				<label htmlFor={textareaId} className="ds-field-label">
					{label}
					{required && <span className="text-error"> *</span>}
				</label>
			)}
			<textarea
				id={textareaId}
				required={required}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy}
				className={["textarea w-full bg-base-100 leading-6", error && "textarea-error", className]
					.filter(Boolean)
					.join(" ")}
				{...rest}
			/>
			{error ? (
				<p id={`${textareaId}-error`} role="alert" className="ds-field-note ds-field-note-error">{error}</p>
			) : helperText ? (
				<p id={`${textareaId}-helper`} className="ds-field-note ds-field-note-muted">{helperText}</p>
			) : null}
		</div>
	);
}
