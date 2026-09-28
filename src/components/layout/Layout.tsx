import type {JSX, ReactNode} from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

type LayoutProps = {
	children: ReactNode;
};

export default function Layout({children}: LayoutProps): JSX.Element {
	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer-4" type="checkbox" className="drawer-toggle" />

			<div className="drawer-content flex min-h-screen flex-col">
				<Navbar />

				<main className="mx-auto w-full max-w-7xl grow px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					{children}
				</main>

				<Footer />
			</div>

			<Sidebar />
		</div>
	);
}
