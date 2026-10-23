import {useMemo, type JSX} from "react";
import {toSafeHtml} from "../../utils/richText";

export type RichTextProps = {
	/** HTML do editor (ou texto puro legado). É sanitizado antes de renderizar. */
	value: string;
	className?: string;
};

/** Exibe conteúdo produzido pelo `RichTextEditor`. */
export default function RichText({value, className}: RichTextProps): JSX.Element {
	const html = useMemo(() => toSafeHtml(value), [value]);

	return (
		<div
			className={["tl-rich-text", className].filter(Boolean).join(" ")}
			dangerouslySetInnerHTML={{__html: html}}
		/>
	);
}
