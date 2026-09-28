import {useId, type JSX, type SelectHTMLAttributes} from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
	label?: string;
	error?: string;
	helperText?: string;
};

export default function Select({
	label,
	error,
	helperText,
	id,
	required,
	className,
	children,
	...rest
}: SelectProps): JSX.Element {
	const generatedId = useId();
	const selectId = id ?? generatedId;
	const describedBy = error
		? `${selectId}-error`
		: helperText
			? `${selectId}-helper`
			: undefined;

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={selectId} className="label mb-1 px-0 py-0 text-sm font-medium">
					{label}
					{required && <span className="text-error"> *</span>}
				</label>
			)}
			<select
				id={selectId}
				required={required}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy}
				className={["select select-bordered w-full bg-base-100", error && "select-error", className]
					.filter(Boolean)
					.join(" ")}
				{...rest}>
				{children}
			</select>
			{error ? (
				<p id={`${selectId}-error`} role="alert" className="text-error mt-1.5 text-xs leading-5">
					{error}
				</p>
			) : (
				helperText && (
					<p id={`${selectId}-helper`} className="text-base-content/60 mt-1.5 text-xs leading-5">
						{helperText}
					</p>
				)
			)}
		</div>
	);
}
