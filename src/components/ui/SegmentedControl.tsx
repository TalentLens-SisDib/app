import type {JSX} from "react";

export type SegmentedControlProps<T extends string> = {
	value: T;
	onChange: (value: T) => void;
	options: {value: T; label: string}[];
	/** Rótulo acessível do grupo (ex.: "Filtrar vagas"). */
	label: string;
};

/** Filtro de poucas opções exclusivas, na barra de listagem. */
export default function SegmentedControl<T extends string>({
	value,
	onChange,
	options,
	label,
}: SegmentedControlProps<T>): JSX.Element {
	return (
		<div role="group" aria-label={label} className="tl-segmented">
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					aria-pressed={option.value === value}
					onClick={() => onChange(option.value)}
					className="tl-segmented-item">
					{option.label}
				</button>
			))}
		</div>
	);
}
