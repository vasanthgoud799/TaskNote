import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import "./index.css";

document.documentElement.dataset.theme = localStorage.getItem("tasknote.theme") || "amoled";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
        <App />
        <Toaster richColors position="top-right" />
    </AuthProvider>
  </BrowserRouter>
);
