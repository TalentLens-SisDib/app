import type {JSX} from "react";

/** Grade de cards em carregamento, no formato dos cards de entidade. */
export function CardGridSkeleton({count = 6, label}: {count?: number; label: string}): JSX.Element {
	return (
		<ul aria-busy="true" aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{Array.from({length: count}, (_, index) => (
				<li key={index} className="tl-entity-card gap-3">
					<div className="skeleton h-4 w-2/3" />
					<div className="skeleton h-3 w-full" />
					<div className="skeleton h-3 w-4/5" />
					<div className="flex gap-1.5">
						<div className="skeleton h-5 w-16" />
						<div className="skeleton h-5 w-12" />
						<div className="skeleton h-5 w-14" />
					</div>
					<div className="border-base-300 mt-1 border-t pt-3">
						<div className="skeleton h-3 w-1/3" />
					</div>
				</li>
			))}
		</ul>
	);
}

/** Tabela em carregamento: cabeçalho fixo e linhas na altura real. */
export function TableSkeleton({rows = 8, columns = 4, label}: {rows?: number; columns?: number; label: string}): JSX.Element {
	return (
		<div aria-busy="true" aria-label={label} className="tl-panel overflow-hidden">
			<div className="bg-base-200/70 border-base-300 h-10 border-b" />
			{Array.from({length: rows}, (_, row) => (
				<div key={row} className="border-base-300 flex h-12 items-center gap-6 border-b px-4 last:border-b-0">
					{Array.from({length: columns}, (_, column) => (
						<div key={column} className={`skeleton h-3 ${column === 0 ? "w-32" : "w-full max-w-48 flex-1"}`} />
					))}
				</div>
			))}
		</div>
	);
}
