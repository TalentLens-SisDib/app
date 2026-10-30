import type {JSX, ReactNode} from "react";

type ChartEmptyProps = {
	icon: ReactNode;
	title: string;
	children?: ReactNode;
};

export default function ChartEmpty({icon, title, children}: ChartEmptyProps): JSX.Element {
	return (
		<div className="bg-base-200/50 rounded-lg flex min-h-48 grow flex-col items-center justify-center gap-3 px-6 py-8 text-center">
			<span className="bg-base-100 border-base-300 text-base-content/50 grid size-10 place-items-center rounded-lg border">
				{icon}
			</span>
			<div className="max-w-xs">
				<p className="text-sm font-medium">{title}</p>
				{children && <div className="text-base-content/60 mt-1 text-xs leading-5">{children}</div>}
			</div>
		</div>
	);
}
