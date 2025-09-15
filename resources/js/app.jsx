import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import DashboardLayout from "@/Layouts/DashboardLayout"; // Import your DashboardLayout

const appName = import.meta.env.VITE_APP_NAME || "Centre Red city";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const page = resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        );

        // Apply the DashboardLayout to all pages by default
        if (!page.layout) {
            page.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
