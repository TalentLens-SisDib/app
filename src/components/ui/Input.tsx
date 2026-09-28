import {useId, type InputHTMLAttributes, type JSX} from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
	helperText?: string;
};

export default function Input({
	label,
	error,
	helperText,
	id,
	required,
	className,
	...rest
}: InputProps): JSX.Element {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const describedBy = error
		? `${inputId}-error`
		: helperText
			? `${inputId}-helper`
			: undefined;

	return (
		<div className="ds-field">
			{label && (
				<label htmlFor={inputId} className="ds-field-label">
					{label}
					{required && <span className="text-error"> *</span>}
				</label>
			)}
			<input
				id={inputId}
				required={required}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy}
				className={["input input-bordered w-full bg-base-100", error && "input-error", className]
					.filter(Boolean)
					.join(" ")}
				{...rest}
			/>
			{error ? (
				<p id={`${inputId}-error`} role="alert" className="ds-field-note ds-field-note-error">{error}</p>
			) : helperText ? (
				<p id={`${inputId}-helper`} className="ds-field-note ds-field-note-muted">{helperText}</p>
			) : null}
		</div>
	);
}
