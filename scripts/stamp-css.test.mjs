import { describe, expect, it } from "vitest";
import { cssVersion, stampWikiCssLink } from "./stamp-css.mjs";

const V = "711ec3a3";

describe("stampWikiCssLink", () => {
  it("acrescenta a versão no link, do jeito que o Vite gera (crossorigin, sem espaço antes do >)", () => {
    const html = '<link rel="stylesheet" crossorigin href="/assets/wiki.css">';
    expect(stampWikiCssLink(html, V)).toBe('<link rel="stylesheet" crossorigin href="/assets/wiki.css?v=711ec3a3">');
  });
  it("acrescenta a versão do jeito que reset-senha.html e cadastro.html escrevem (self-closing)", () => {
    const html = '<link rel="stylesheet" href="/assets/wiki.css" />';
    expect(stampWikiCssLink(html, V)).toBe('<link rel="stylesheet" href="/assets/wiki.css?v=711ec3a3" />');
  });
  it("[REGRESSÃO] rodar de novo com o mesmo hash não é erro: troca a versão igual por igual", () => {
    const already = '<link rel="stylesheet" href="/assets/wiki.css?v=711ec3a3">';
    expect(stampWikiCssLink(already, V)).toBe(already);
  });
  it("troca uma versão antiga por uma nova, sem acumular ?v= duas vezes", () => {
    const old = '<link rel="stylesheet" href="/assets/wiki.css?v=aaaaaaaa">';
    expect(stampWikiCssLink(old, "bbbbbbbb")).toBe('<link rel="stylesheet" href="/assets/wiki.css?v=bbbbbbbb">');
  });
  it("null quando a página não carrega o wiki.css (erro de verdade, não CSS igual ao de antes)", () => {
    expect(stampWikiCssLink("<html><head></head></html>", V)).toBeNull();
  });
});

describe("cssVersion", () => {
  it("é estável pro mesmo conteúdo e muda quando o CSS muda", () => {
    const a = Buffer.from(".x{color:red}");
    const b = Buffer.from(".x{color:blue}");
    expect(cssVersion(a)).toBe(cssVersion(a));
    expect(cssVersion(a)).not.toBe(cssVersion(b));
    expect(cssVersion(a)).toMatch(/^[0-9a-f]{8}$/);
  });
});
