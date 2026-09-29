import type {JSX} from "react";
import {Route, Routes} from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import UiPlayground from "../pages/UiPlayground";
import Users from "../pages/Users";

export default function AppRoutes(): JSX.Element {
	return (
		<Routes>
			<Route element={<AuthLayout />}>
				<Route path="/login" element={<Login />} />
			</Route>

			<Route element={<AppLayout />}>
				<Route path="/" element={<Dashboard />} />
				<Route path="/ui-playground" element={<UiPlayground />} />
				<Route path="/usuarios" element={<Users />} />
			</Route>

			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
