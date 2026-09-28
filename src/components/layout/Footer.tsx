import type {JSX} from "react";

export default function Footer(): JSX.Element {
	return (
		<footer className="footer sm:footer-horizontal footer-center border-base-300 bg-base-100 text-base-content/60 border-t p-4 text-sm">
			<aside>
				<p>
					Copyright © {new Date().getFullYear()} - All right reserved by
					TalentLens
				</p>
			</aside>
		</footer>
	);
}
