import { Navigate, Route, Routes } from "react-router-dom";
import { WikiHomePage } from "./pages/WikiHomePage";
import { EntryPage } from "./pages/EntryPage";
import { TimelinePage } from "./pages/TimelinePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ErrorPage } from "./pages/ErrorPage";

export default function App() {
  return (
    <Routes>
      {/* A home do site é trabalho da colaboradora (docs/plano-passagem.md); por enquanto / só
          leva pra wiki. */}
      <Route path="/" element={<Navigate to="/wiki" replace />} />
      <Route path="/wiki" element={<WikiHomePage />} />
      <Route path="/wiki/_timeline" element={<TimelinePage />} />
      <Route path="/wiki/_perfil" element={<ProfilePage />} />
      <Route path="/wiki/:slug" element={<EntryPage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
