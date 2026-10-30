import type {JSX} from "react";

type MeterProps = {
	value: number;
	total: number;
	/** Classe de fundo do preenchimento (token do tema). */
	fillClassName: string;
	label: string;
};

/** Barra de proporção compacta, para os cards de métricas. */
export default function Meter({value, total, fillClassName, label}: MeterProps): JSX.Element {
	const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
	return (
		<div
			role="meter"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={total}
			aria-valuenow={value}
			className="mb-1 w-24 shrink-0">
			<div className="bg-base-200 h-1.5 overflow-hidden rounded-full">
				<div className={`h-full rounded-full ${fillClassName}`} style={{width: `${percent}%`}} />
			</div>
			<p className="text-base-content/55 mt-1.5 text-right text-[0.6875rem] leading-none tabular-nums">
				{value}/{total}
			</p>
		</div>
	);
}
