import "reflect-metadata";

import { GenderEnum } from "@/enums/GenderEnum";
import {
  CreateUserInput,
  UpdateUserInput,
  UserLoginInput,
} from "@/resolvers/user/UserInputs";
import { validate } from "class-validator";

describe("Validation Test Suite - GraphQL Inputs (UserInput & UserLoginInput)", () => {
  describe("CreateUserInput DTO", () => {
    let validUserInput: CreateUserInput;

    beforeEach(() => {
      validUserInput = new CreateUserInput();
      validUserInput.name = "Abel Carvalho";
      validUserInput.dateBorn = "1995-05-15T00:00:00.000Z";
      validUserInput.gender = GenderEnum.MALE;
      validUserInput.email = "abel@example.com";
      validUserInput.username = "abelcarvalho";
      validUserInput.password = "StrongPassword#2026";
      validUserInput.salary = "5000.00";
      validUserInput.phone = "+5574999999999";
    });

    it("deve passar na validação quando todos os campos estiverem corretos", async () => {
      const errors = await validate(validUserInput);
      expect(errors).toHaveLength(0);
    });

    it("deve passar na validação quando os campos opcionais forem undefined ou null", async () => {
      validUserInput.password = null;
      validUserInput.salary = null;
      validUserInput.phone = null;

      const errorsWithNull = await validate(validUserInput);
      expect(errorsWithNull).toHaveLength(0);

      validUserInput.password = undefined;
      validUserInput.salary = undefined;
      validUserInput.phone = undefined;

      const errorsWithUndefined = await validate(validUserInput);
      expect(errorsWithUndefined).toHaveLength(0);
    });

    describe("Campo 'name'", () => {
      it("deve falhar se o nome ultrapassar 64 caracteres", async () => {
        validUserInput.name = "a".repeat(65);

        const errors = await validate(validUserInput);
        const nameError = errors.find((err) => err.property === "name");

        expect(nameError?.constraints?.maxLength).toBe(
          "Name must be at most 64 characters long."
        );
      });
    });

    describe("Campo 'dateBorn'", () => {
      it("deve falhar se dateBorn não for uma data válida", async () => {
        validUserInput.dateBorn = "1995-05-15asdjimafijoe";

        const errors = await validate(validUserInput);
        const dateError = errors.find((err) => err.property === "dateBorn");

        expect(dateError?.constraints?.isDateString).toBe(
          "Date of birth must be a valid date."
        );
      });
    });

    describe("Campo 'gender'", () => {
      it("deve falhar se gender não for um valor válido do GenderEnum", async () => {
        validUserInput.gender = "OTHER_INVALID" as unknown as GenderEnum;

        const errors = await validate(validUserInput);
        const genderError = errors.find((err) => err.property === "gender");

        expect(genderError?.constraints?.isEnum).toBe(
          "Gender must be a valid enum value."
        );
      });
    });

    describe("Campo 'email'", () => {
      it("deve falhar se o email for inválido", async () => {
        validUserInput.email = "invalid-email-format";

        const errors = await validate(validUserInput);
        const emailError = errors.find((err) => err.property === "email");

        expect(emailError?.constraints?.isEmail).toBe(
          "Email must be a valid email address."
        );
      });

      it("deve falhar se o email ultrapassar 256 caracteres", async () => {
        validUserInput.email = "a".repeat(245) + "@example.com";

        const errors = await validate(validUserInput);
        const emailError = errors.find((err) => err.property === "email");

        expect(emailError?.constraints?.maxLength).toBe(
          "Email must be at most 256 characters long."
        );
      });
    });

    describe("Campo 'username'", () => {
      it.each([
        "a",
        "1user",
        "_user",
        "-user",
        "User",
        "user name",
        "user@name",
      ])(
        "deve falhar para usernames fora do padrão: %s",
        async (invalidUsername) => {
          validUserInput.username = invalidUsername;

          const errors = await validate(validUserInput);
          const usernameError = errors.find(
            (err) => err.property === "username"
          );

          expect(usernameError?.constraints?.isUsername).toBe(
            "Username must be a valid username."
          );
        }
      );

      it("deve passar para usernames válidos respeitando o regex {1,128}", async () => {
        validUserInput.username = "ab";

        const errors = await validate(validUserInput);
        const usernameError = errors.find((err) => err.property === "username");

        expect(usernameError).toBeUndefined();
      });
    });

    describe("Campo 'password'", () => {
      it("deve falhar se ultrapassar 256 caracteres", async () => {
        validUserInput.password = "a".repeat(257);

        const errors = await validate(validUserInput);
        const passError = errors.find((err) => err.property === "password");

        expect(passError?.constraints?.maxLength).toBe(
          "Password must be at most 256 characters long."
        );
      });
    });

    describe("Campo 'salary'", () => {
      it.each(["5000", "5000.00", "$5,000.00", "50.55"])(
        "deve aceitar formatos válidos de moeda: %s",
        async (validSalary) => {
          validUserInput.salary = validSalary;

          const errors = await validate(validUserInput);
          const salaryError = errors.find((err) => err.property === "salary");

          expect(salaryError).toBeUndefined();
        }
      );

      it("deve falhar se salary não for um formato de moeda válido", async () => {
        validUserInput.salary = "invalid_currency_value";

        const errors = await validate(validUserInput);
        const salaryError = errors.find((err) => err.property === "salary");

        expect(salaryError?.constraints?.isCurrency).toBe(
          "Salary must be a valid currency value."
        );
      });
    });

    describe("Campo 'phone'", () => {
      it.each([
        "74999999999",
        "+5574999999999",
        "11987654321",
        "+123456789012",
      ])(
        "deve aceitar formatos válidos de telefone: %s",
        async (validPhone) => {
          validUserInput.phone = validPhone;

          const errors = await validate(validUserInput);
          const phoneError = errors.find((err) => err.property === "phone");

          expect(phoneError).toBeUndefined();
        }
      );

      it.each(["123", "+12345678901234", "phone123456", "+55 (74) 99999-9999"])(
        "deve falhar para formatos inválidos de telefone: %s",
        async (invalidPhone) => {
          validUserInput.phone = invalidPhone;

          const errors = await validate(validUserInput);
          const phoneError = errors.find((err) => err.property === "phone");

          // CORREÇÃO AQUI: isPhone em vez de matches
          expect(phoneError?.constraints?.isPhone).toBe(
            "Phone number must be a valid phone number."
          );
        }
      );
    });
  });

  describe("UpdateUserInput DTO", () => {
    let validUserInput: UpdateUserInput;

    beforeEach(() => {
      validUserInput = new UpdateUserInput();
      validUserInput.name = "Abel Carvalho";
      validUserInput.dateBorn = "1995-05-15T00:00:00.000Z";
      validUserInput.gender = GenderEnum.MALE;
      validUserInput.email = "abel@example.com";
      validUserInput.username = "abelcarvalho";
      validUserInput.salary = "5000.00";
      validUserInput.phone = "+5574999999999";
    });

    it("deve passar na validação quando todos os campos estiverem corretos", async () => {
      const errors = await validate(validUserInput);
      expect(errors).toHaveLength(0);
    });

    it("deve passar na validação quando os campos opcionais forem undefined ou null", async () => {
      validUserInput.salary = null;
      validUserInput.phone = null;

      const errorsWithNull = await validate(validUserInput);
      expect(errorsWithNull).toHaveLength(0);

      validUserInput.salary = undefined;
      validUserInput.phone = undefined;

      const errorsWithUndefined = await validate(validUserInput);
      expect(errorsWithUndefined).toHaveLength(0);
    });

    describe("Campo 'name'", () => {
      it("deve falhar se o nome ultrapassar 64 caracteres", async () => {
        validUserInput.name = "a".repeat(65);

        const errors = await validate(validUserInput);
        const nameError = errors.find((err) => err.property === "name");

        expect(nameError?.constraints?.maxLength).toBe(
          "Name must be at most 64 characters long."
        );
      });
    });

    describe("Campo 'dateBorn'", () => {
      it("deve falhar se dateBorn não for uma data válida", async () => {
        validUserInput.dateBorn = "1995-05-15asdjimafijoe";

        const errors = await validate(validUserInput);
        const dateError = errors.find((err) => err.property === "dateBorn");

        expect(dateError?.constraints?.isDateString).toBe(
          "Date of birth must be a valid date."
        );
      });
    });

    describe("Campo 'gender'", () => {
      it("deve falhar se gender não for um valor válido do GenderEnum", async () => {
        validUserInput.gender = "OTHER_INVALID" as unknown as GenderEnum;

        const errors = await validate(validUserInput);
        const genderError = errors.find((err) => err.property === "gender");

        expect(genderError?.constraints?.isEnum).toBe(
          "Gender must be a valid enum value."
        );
      });
    });

    describe("Campo 'email'", () => {
      it("deve falhar se o email for inválido", async () => {
        validUserInput.email = "invalid-email-format";

        const errors = await validate(validUserInput);
        const emailError = errors.find((err) => err.property === "email");

        expect(emailError?.constraints?.isEmail).toBe(
          "Email must be a valid email address."
        );
      });

      it("deve falhar se o email ultrapassar 256 caracteres", async () => {
        validUserInput.email = "a".repeat(245) + "@example.com";

        const errors = await validate(validUserInput);
        const emailError = errors.find((err) => err.property === "email");

        expect(emailError?.constraints?.maxLength).toBe(
          "Email must be at most 256 characters long."
        );
      });
    });

    describe("Campo 'username'", () => {
      it.each([
        "a",
        "1user",
        "_user",
        "-user",
        "User",
        "user name",
        "user@name",
      ])(
        "deve falhar para usernames fora do padrão: %s",
        async (invalidUsername) => {
          validUserInput.username = invalidUsername;

          const errors = await validate(validUserInput);
          const usernameError = errors.find(
            (err) => err.property === "username"
          );

          expect(usernameError?.constraints?.isUsername).toBe(
            "Username must be a valid username."
          );
        }
      );

      it("deve passar para usernames válidos respeitando o regex {1,128}", async () => {
        validUserInput.username = "ab";

        const errors = await validate(validUserInput);
        const usernameError = errors.find((err) => err.property === "username");

        expect(usernameError).toBeUndefined();
      });
    });

    describe("Campo 'salary'", () => {
      it.each(["5000", "5000.00", "$5,000.00", "50.55"])(
        "deve aceitar formatos válidos de moeda: %s",
        async (validSalary) => {
          validUserInput.salary = validSalary;

          const errors = await validate(validUserInput);
          const salaryError = errors.find((err) => err.property === "salary");

          expect(salaryError).toBeUndefined();
        }
      );

      it("deve falhar se salary não for um formato de moeda válido", async () => {
        validUserInput.salary = "invalid_currency_value";

        const errors = await validate(validUserInput);
        const salaryError = errors.find((err) => err.property === "salary");

        expect(salaryError?.constraints?.isCurrency).toBe(
          "Salary must be a valid currency value."
        );
      });
    });

    describe("Campo 'phone'", () => {
      it.each([
        "74999999999",
        "+5574999999999",
        "11987654321",
        "+123456789012",
      ])(
        "deve aceitar formatos válidos de telefone: %s",
        async (validPhone) => {
          validUserInput.phone = validPhone;

          const errors = await validate(validUserInput);
          const phoneError = errors.find((err) => err.property === "phone");

          expect(phoneError).toBeUndefined();
        }
      );

      it.each(["123", "+12345678901234", "phone123456", "+55 (74) 99999-9999"])(
        "deve falhar para formatos inválidos de telefone: %s",
        async (invalidPhone) => {
          validUserInput.phone = invalidPhone;

          const errors = await validate(validUserInput);
          const phoneError = errors.find((err) => err.property === "phone");

          // CORREÇÃO AQUI: isPhone em vez de matches
          expect(phoneError?.constraints?.isPhone).toBe(
            "Phone number must be a valid phone number."
          );
        }
      );
    });
  });

  describe("UserLoginInput DTO", () => {
    let validLoginInput: UserLoginInput;

    beforeEach(() => {
      validLoginInput = new UserLoginInput();
      validLoginInput.username = "abelcarvalho";
      validLoginInput.password = "StrongPassword#2026";
    });

    it("deve passar na validação quando username e password forem válidos", async () => {
      const errors = await validate(validLoginInput);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar se username ultrapassar 256 caracteres", async () => {
      validLoginInput.username = "a".repeat(257);

      const errors = await validate(validLoginInput);
      const usernameError = errors.find((err) => err.property === "username");

      expect(usernameError?.constraints?.maxLength).toBe(
        "User access must be at most 256 characters long."
      );
    });

    it("deve falhar se password ultrapassar 256 caracteres", async () => {
      validLoginInput.password = "a".repeat(257);

      const errors = await validate(validLoginInput);
      const passError = errors.find((err) => err.property === "password");

      expect(passError?.constraints?.maxLength).toBe(
        "Password must be at most 256 characters long."
      );
    });

    it("deve falhar se campos obrigatórios forem undefined", async () => {
      const emptyInput = new UserLoginInput();

      const errors = await validate(emptyInput);

      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
