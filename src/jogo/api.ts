import { getIdToken } from "../lib/auth";
import { createApiClient, type ApiClientDeps } from "./apiClient";

/** Endereço da API do jogo, vindo do build (`VITE_API_URL`); em `npm run dev`, a API local. */
export const API_URL: string = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8001" : "");

/** Cliente pronto pro site, com o login do Firebase. `onWaking` avisa quando o servidor está acordando. */
export function jogoApi(onWaking?: ApiClientDeps["onWaking"]) {
  return createApiClient({
    baseUrl: API_URL,
    fetch: (url, init) => fetch(url, init),
    getToken: getIdToken,
    onWaking,
  });
}
