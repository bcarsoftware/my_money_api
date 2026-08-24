import { usernameVerify } from "@/utils/verifiers/usernameVerify";

describe("usernameVerify - Validação de Nome de Usuário", () => {
  describe("Cenários de Sucesso", () => {
    it.each([
      "abc",
      "abelcarvalho",
      "user123",
      "dev_fullstack",
      "front-end-dev",
      "u_1-a",
      "a" + "b".repeat(128),
    ])("deve retornar true para usernames válidos: %s", (validUsername) => {
      expect(usernameVerify(validUsername)).toBe(true);
    });
  });

  describe("Validação de Tamanho", () => {
    it("deve retornar false se tiver menos de 2 caracteres", () => {
      expect(usernameVerify("")).toBe(false);
      expect(usernameVerify("a")).toBe(false);
      expect(usernameVerify("ab")).toBe(true);
    });

    it("deve retornar false se exceder o limite máximo", () => {
      const oversizedUsername = "a" + "b".repeat(129);
      expect(usernameVerify(oversizedUsername)).toBe(false);
    });
  });

  describe("Validação de Caractere Inicial", () => {
    it.each(["1user", "_username", "-username", "User", " Abel"])(
      "deve retornar false se não começar com letra minúscula: %s",
      (invalidStart) => {
        expect(usernameVerify(invalidStart)).toBe(false);
      }
    );
  });

  describe("Caracteres Inválidos e Formatação", () => {
    it.each([
      "user name",
      "user@name",
      "user.name",
      "user#123",
      "user!name",
      "userName",
      "usuário",
      "user/name",
    ])(
      "deve retornar false se contiver caracteres proibidos: %s",
      (forbiddenInput) => {
        expect(usernameVerify(forbiddenInput)).toBe(false);
      }
    );
  });

  describe("Validação de Tipagem e Nulos", () => {
    it("deve retornar false para valores nulos, indefinidos ou tipos não-string", () => {
      expect(usernameVerify(null as unknown as string)).toBe(false);
      expect(usernameVerify(undefined as unknown as string)).toBe(false);
      expect(usernameVerify(123456 as unknown as string)).toBe(false);
      expect(usernameVerify({} as unknown as string)).toBe(false);
    });
  });
});
