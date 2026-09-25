import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { WikiHomePage } from "./pages/WikiHomePage";
import { EntryPage } from "./pages/EntryPage";
import { TimelinePage } from "./pages/TimelinePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { ErrorPage } from "./pages/ErrorPage";
import { MemberPage } from "./pages/MemberPage";
import { ScrollToTop } from "./components/ScrollToTop";

// Cada ?q=/?tipo=/?aleatoria= novo é uma home nova, como um carregamento da página de hoje
// (link "Personagens" da barra estando já na home, por exemplo).
function HomeRoute() {
  const { search } = useLocation();
  return <WikiHomePage key={search} />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* A home do site é trabalho da colaboradora (docs/plano-passagem.md); por enquanto / só
            leva pra wiki. */}
        <Route path="/" element={<Navigate to="/wiki" replace />} />
        <Route path="/wiki" element={<HomeRoute />} />
        <Route path="/wiki/_timeline" element={<TimelinePage />} />
        <Route path="/wiki/_perfil" element={<ProfilePage />} />
        <Route path="/wiki/_busca" element={<SearchPage />} />
        <Route path="/wiki/:slug" element={<EntryPage />} />
        {/* Perfil público de um membro: /@nome (MemberPage confere o @). */}
        <Route path="/:handle" element={<MemberPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}
