import type {JSX, ReactNode} from "react";

export type ListToolbarProps = {
	/** Filtros e busca, à esquerda. */
	children: ReactNode;
	/** Contagem de resultados (ex.: "3 de 12 vagas"), à direita. */
	count?: ReactNode;
};

/** Barra entre o cabeçalho e a listagem: filtros + busca à esquerda, contagem à direita. */
export default function ListToolbar({children, count}: ListToolbarProps): JSX.Element {
	return (
		<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">{children}</div>
			{count != null && (
				<p aria-live="polite" className="text-base-content/55 shrink-0 text-xs tabular-nums sm:text-sm">
					{count}
				</p>
			)}
		</div>
	);
}
