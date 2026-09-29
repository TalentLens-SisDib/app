import type {JSX} from "react";
import {Outlet} from "react-router-dom";
import Layout from "./Layout";

export default function AppLayout(): JSX.Element {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
