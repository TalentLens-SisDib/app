import type {JSX} from "react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

export type SpinnerProps = {
	size?: SpinnerSize;
	className?: string;
	label?: string;
};

export default function Spinner({
	size = "md",
	className,
	label = "Carregando",
}: SpinnerProps): JSX.Element {
	return (
		<span
			role="status"
			aria-label={label}
			className={["loading loading-spinner", `loading-${size}`, className]
				.filter(Boolean)
				.join(" ")}
		/>
	);
}
