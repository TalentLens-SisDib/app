import type {JSX} from "react";

type BrandProps = {
	inverse?: boolean;
	showName?: boolean;
};

export default function Brand({
	inverse = false,
	showName = true,
}: BrandProps): JSX.Element {
	return (
		<div className="flex items-center gap-2.5">
			<span className={["tl-brand-mark", inverse && "tl-brand-mark-inverse"].filter(Boolean).join(" ")} aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
					<circle cx="10" cy="10" r="4.5" />
					<path d="m13.5 13.5 4.5 4.5" strokeLinecap="round" />
					<path d="M8 10h4M10 8v4" strokeLinecap="round" />
				</svg>
			</span>
			{showName && (
				<span className={["tl-wordmark text-lg", inverse && "text-primary-content"].filter(Boolean).join(" ")}>
					Talent<span className={inverse ? "text-primary-content/75" : "text-primary"}>Lens</span>
				</span>
			)}
		</div>
	);
}
