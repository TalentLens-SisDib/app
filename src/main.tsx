import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import {initAuth} from "./api/services/auth.ts";
import {Toaster} from "./components/ui/Toast.tsx";

initAuth();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
		<Toaster />
	</StrictMode>,
);
