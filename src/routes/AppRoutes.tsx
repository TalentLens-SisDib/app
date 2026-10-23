import type {JSX} from "react";
import {Route, Routes} from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import Dashboard from "../pages/Dashboard";
import ImportResumes from "../pages/ImportResumes";
import JobOpeningDetail from "../pages/JobOpeningDetail";
import JobOpenings from "../pages/JobOpenings";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Skills from "../pages/Skills";
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
				<Route path="/candidatos/importar" element={<ImportResumes />} />
				<Route path="/ui-playground" element={<UiPlayground />} />
				<Route path="/usuarios" element={<Users />} />
				<Route path="/vagas" element={<JobOpenings />} />
				<Route path="/vagas/:id" element={<JobOpeningDetail />} />
				<Route path="/competencias" element={<Skills />} />
			</Route>

			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
