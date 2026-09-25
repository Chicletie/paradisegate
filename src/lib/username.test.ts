import { describe, expect, it } from "vitest";
import { isEmailLogin } from "./username";

// A regra do username (forma, proibidos, 30 dias) é testada onde ela mora: no repo do autor,
// functions/username.test.js.

describe("entrar com e-mail ou username", () => {
  it("separa um do outro", () => {
    const emails = ["voce@email.com", " a.b+c@x.com.br ", "sara.santos@gmail.com", "jogadores@paradisegate.com.br"];
    for (const n of emails) expect(isEmailLogin(n), n).toBe(true);
    for (const n of ["ania_sombra", "@ania_sombra", "", "a@b@c", "nome com@espaco.com"]) expect(isEmailLogin(n), n).toBe(false);
  });
});
