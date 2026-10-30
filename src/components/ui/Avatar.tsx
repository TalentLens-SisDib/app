import type {JSX} from "react";
import {initialsOf} from "../../utils/initials";

export type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
	sm: "size-7 text-[0.6875rem]",
	md: "size-9 text-xs",
	lg: "size-11 text-sm",
};

/** Iniciais da pessoa. Decorativo: o nome sempre aparece ao lado. */
export default function Avatar({name, size = "md"}: {name: string; size?: AvatarSize}): JSX.Element {
	return (
		<span
			aria-hidden="true"
			className={`bg-primary/10 text-primary ring-primary/15 grid shrink-0 place-items-center rounded-full font-semibold ring-1 ${sizeClass[size]}`}>
			{initialsOf(name)}
		</span>
	);
}
