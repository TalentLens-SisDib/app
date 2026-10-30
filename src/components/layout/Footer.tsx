import type {JSX} from "react";

/** Rodapé discreto, no fim natural do conteúdo (não fixo). */
export default function Footer(): JSX.Element {
	return (
		<footer className="border-base-300 border-t">
			<div className="text-base-content/45 mx-auto max-w-7xl px-4 py-3 text-xs sm:px-6 lg:px-8">
				<p>© {new Date().getFullYear()} TalentLens. Todos os direitos reservados.</p>
			</div>
		</footer>
	);
}
