import DOMPurify from "dompurify";

/** Tags que o editor produz — qualquer outra coisa é descartada ao exibir. */
const ALLOWED_TAGS = [
	"p", "br", "strong", "b", "em", "i", "u", "s", "a",
	"h2", "h3", "ul", "ol", "li", "blockquote", "hr", "code",
];

/** Descrições antigas foram salvas como texto puro (antes do editor rich text). */
export function isRichText(value: string): boolean {
	return /^\s*<(p|h[1-6]|ul|ol|blockquote)[\s>]/i.test(value);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/** Remove tudo que o editor não produz (scripts, estilos, imagens, tabelas...). */
export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {ALLOWED_TAGS, ALLOWED_ATTR: ["href", "target", "rel"]});
}

/** HTML seguro para exibição; texto puro vira parágrafos preservando as quebras. */
export function toSafeHtml(value: string): string {
	const html = isRichText(value)
		? value
		: value
				.split(/\n{2,}/)
				.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
				.join("");

	return sanitizeHtml(html);
}

/** Texto corrido sem marcação — para resumos (cards, buscas). */
export function toPlainText(value: string): string {
	if (!isRichText(value)) return value;
	const doc = new DOMParser().parseFromString(DOMPurify.sanitize(value), "text/html");
	doc.querySelectorAll("p, h2, h3, li, blockquote").forEach((node) => node.append(" "));
	return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}
