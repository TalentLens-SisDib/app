import {lazy, Suspense, type JSX} from "react";
import {Route, Routes} from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import Candidates from "../pages/Candidates";
import ImportResumes from "../pages/ImportResumes";
import JobOpeningDetail from "../pages/JobOpeningDetail";
import JobOpenings from "../pages/JobOpenings";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import ProfileDetail from "../pages/ProfileDetail";
import Skills from "../pages/Skills";
import UiPlayground from "../pages/UiPlayground";
import Users from "../pages/Users";
import {Spinner} from "../components/ui";

// O Recharts é pesado: só é baixado quando o dashboard abre.
const Dashboard = lazy(() => import("../pages/Dashboard"));

export default function AppRoutes(): JSX.Element {
	return (
		<Routes>
			<Route element={<AuthLayout />}>
				<Route path="/login" element={<Login />} />
			</Route>

			<Route element={<AppLayout />}>
				<Route
					path="/"
					element={
						<Suspense
							fallback={
								<div className="flex justify-center py-24">
									<Spinner />
								</div>
							}>
							<Dashboard />
						</Suspense>
					}
				/>
				<Route path="/candidatos" element={<Candidates />} />
				<Route path="/candidatos/importar" element={<ImportResumes />} />
				<Route path="/candidatos/:id" element={<ProfileDetail />} />
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
