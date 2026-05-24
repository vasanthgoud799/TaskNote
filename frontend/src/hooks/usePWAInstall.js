import { useEffect, useState } from "react";

export const usePWAInstall = () => {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isLocalDev =
      import.meta.env.DEV ||
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    if ("serviceWorker" in navigator) {
      if (isLocalDev) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .then(() => caches?.keys?.())
          .then((keys) => Promise.all((keys || []).map((key) => caches.delete(key))))
          .catch(() => {});
      } else {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }

    const beforeInstall = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const appInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const result = await prompt.userChoice;
    setPrompt(null);
    return result.outcome === "accepted";
  };

  return { canInstall: Boolean(prompt), installed, install };
};
