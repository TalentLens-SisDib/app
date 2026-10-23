import {lazy, Suspense, type JSX} from "react";
import type {RichTextEditorProps} from "./RichTextEditor";
import Spinner from "./Spinner";

// O Tiptap é pesado: só é baixado quando algum editor aparece na tela.
const RichTextEditor = lazy(() => import("./RichTextEditor"));

/** `RichTextEditor` carregado sob demanda — é esta versão que o barrel exporta. */
export default function LazyRichTextEditor(props: RichTextEditorProps): JSX.Element {
	return (
		<Suspense
			fallback={
				<div className="text-base-content/60 flex h-40 items-center justify-center gap-2 text-sm">
					<Spinner size="xs" /> Carregando editor...
				</div>
			}>
			<RichTextEditor {...props} />
		</Suspense>
	);
}
