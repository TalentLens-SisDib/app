import type {JSX} from "react";
import {Navigate, Outlet} from "react-router-dom";
import {useSession} from "../../hooks/useSession";

export default function AuthLayout(): JSX.Element {
	const session = useSession();

	if (session) return <Navigate to="/" replace />;

	return <Outlet />;
}
