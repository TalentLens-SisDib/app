import type {JSX} from "react";
import {Navigate, Outlet} from "react-router-dom";
import {useSession} from "../../hooks/useSession";
import Layout from "./Layout";

export default function AppLayout(): JSX.Element {
	const session = useSession();

	if (!session) return <Navigate to="/login" replace />;

	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
