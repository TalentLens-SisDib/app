import {useId, type JSX} from "react";

type SparklineProps = {
	values: number[];
	/** Descrição para leitores de tela (ex.: "Novos candidatos por semana"). */
	label: string;
	className?: string;
};

const WIDTH = 96;
const HEIGHT = 32;
const PAD = 3;

/** Tendência compacta, sem eixos: a cor vem de `currentColor`. */
export default function Sparkline({values, label, className}: SparklineProps): JSX.Element | null {
	// Ids do React têm caracteres que não funcionam em `url(#...)`.
	const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
	if (values.length < 2) return null;

	const max = Math.max(...values, 1);
	const step = (WIDTH - PAD * 2) / (values.length - 1);
	const points = values.map((value, index) => [
		PAD + index * step,
		HEIGHT - PAD - (value / max) * (HEIGHT - PAD * 2),
	]);
	const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
	const [lastX, lastY] = points[points.length - 1];

	return (
		<svg
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			width={WIDTH}
			height={HEIGHT}
			role="img"
			aria-label={label}
			className={["shrink-0 overflow-visible", className].filter(Boolean).join(" ")}>
			<defs>
				<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stopColor="currentColor" stopOpacity={0.16} />
					<stop offset="100%" stopColor="currentColor" stopOpacity={0} />
				</linearGradient>
			</defs>
			<polygon
				points={`${PAD},${HEIGHT - PAD} ${line} ${lastX.toFixed(1)},${HEIGHT - PAD}`}
				fill={`url(#${gradientId})`}
			/>
			<polyline
				points={line}
				fill="none"
				stroke="currentColor"
				strokeWidth={1.75}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<circle cx={lastX} cy={lastY} r={3} fill="currentColor" stroke="var(--color-base-100)" strokeWidth={1.5} />
		</svg>
	);
}
