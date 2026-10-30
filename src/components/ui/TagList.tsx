import type {JSX} from "react";
import Badge, {type BadgeVariant} from "./Badge";

export type TagListItem = {id: string; label: string; variant?: BadgeVariant};

export type TagListProps = {
	items: TagListItem[];
	/** Quantas tags mostrar antes do "+N". */
	max?: number;
};

/** Tags com excedente resumido em "+N"; o tooltip do "+N" lista as que ficaram de fora. */
export default function TagList({items, max = 4}: TagListProps): JSX.Element | null {
	if (items.length === 0) return null;
	const visible = items.slice(0, max);
	const hidden = items.slice(max);

	return (
		<ul className="flex flex-wrap gap-1.5">
			{visible.map((item) => (
				<li key={item.id} className="max-w-full">
					<Badge size="sm" variant={item.variant ?? "neutral"} className="truncate">
						{item.label}
					</Badge>
				</li>
			))}
			{hidden.length > 0 && (
				<li className="tooltip relative z-10" data-tip={hidden.map((item) => item.label).join(", ")}>
					<Badge size="sm" variant="outline" aria-label={`Mais ${hidden.length}: ${hidden.map((item) => item.label).join(", ")}`}>
						+{hidden.length}
					</Badge>
				</li>
			)}
		</ul>
	);
}
