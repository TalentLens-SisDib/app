import type {JSX} from "react";
import {Outlet} from "react-router-dom";

export default function AuthLayout(): JSX.Element {
	return <Outlet />;
}
