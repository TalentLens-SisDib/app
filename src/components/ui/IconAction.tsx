import type {ButtonHTMLAttributes, JSX, ReactNode} from "react";

export type IconActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
	/** Rótulo acessível e tooltip. */
	label: string;
	icon: ReactNode;
	/** Ação destrutiva: vermelho no hover. */
	danger?: boolean;
	tooltipPosition?: "top" | "left" | "bottom";
};

const tooltipClass = {top: "tooltip-top", left: "tooltip-left", bottom: "tooltip-bottom"};

/** Ação secundária de linha/card (editar, remover): ícone discreto com tooltip. */
export default function IconAction({
	label,
	icon,
	danger = false,
	tooltipPosition = "top",
	className,
	...rest
}: IconActionProps): JSX.Element {
	return (
		<span className={`tooltip ${tooltipClass[tooltipPosition]}`} data-tip={label}>
			<button
				type="button"
				aria-label={label}
				className={["tl-icon-action", danger && "tl-icon-action-danger", className].filter(Boolean).join(" ")}
				{...rest}>
				{icon}
			</button>
		</span>
	);
}
