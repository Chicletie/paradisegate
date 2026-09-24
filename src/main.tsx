import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { restorePrettyUrl } from "./lib/restorePrettyUrl";
import { WikiIndexProvider } from "./lib/wikiIndex";
import { AccountProvider } from "./lib/account";

restorePrettyUrl(location.search, (url) => history.replaceState(null, "", url));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <WikiIndexProvider>
        <AccountProvider>
          <App />
        </AccountProvider>
      </WikiIndexProvider>
    </BrowserRouter>
  </StrictMode>,
);
