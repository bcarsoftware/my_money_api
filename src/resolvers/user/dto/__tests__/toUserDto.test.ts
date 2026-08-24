import { User } from "@/entities/User";
import { GenderEnum } from "@/enums/GenderEnum";
import { toUserDto } from "@/resolvers/user/dto/toUserDto";

describe("toUserDto - Mapper de Entidade para DTO", () => {
  const mockDate = new Date("1995-05-15T00:00:00.000Z");
  const mockCreatedAt = new Date("2026-01-01T10:00:00.000Z");
  const mockUpdatedAt = new Date("2026-01-02T10:00:00.000Z");
  const mockDeletedAt = new Date("2026-01-03T10:00:00.000Z");

  it("deve mapear todos os campos corretamente para UserDto incluindo campos opcionais preenchidos", () => {
    const user = new User();
    user.id = "550e8400-e29b-41d4-a716-446655440000";
    user.name = "Abel Carvalho";
    user.dateBorn = mockDate;
    user.gender = GenderEnum.MALE;
    user.email = "abel@example.com";
    user.username = "abelcarvalho";
    user.password = "hashed_password_secret";
    user.salary = "5000.00";
    user.phone = "+5574999999999";
    user.createdAt = mockCreatedAt;
    user.updatedAt = mockUpdatedAt;
    user.deletedAt = mockDeletedAt;

    const dto = toUserDto(user);

    expect(dto).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Abel Carvalho",
      dateBorn: mockDate,
      gender: GenderEnum.MALE,
      email: "abel@example.com",
      username: "abelcarvalho",
      salary: "5000.00",
      phone: "+5574999999999",
      createdAt: mockCreatedAt,
    });
  });

  it("deve omitir dados sensíveis e colunas internas de auditoria (password, updatedAt, deletedAt)", () => {
    const user = new User();
    user.id = "550e8400-e29b-41d4-a716-446655440000";
    user.name = "Abel Carvalho";
    user.dateBorn = mockDate;
    user.gender = GenderEnum.MALE;
    user.email = "abel@example.com";
    user.username = "abelcarvalho";
    user.password = "super_secret_hash";
    user.createdAt = mockCreatedAt;
    user.updatedAt = mockUpdatedAt;
    user.deletedAt = mockDeletedAt;

    const dto = toUserDto(user) as unknown as Record<string, unknown>;

    expect(dto).not.toHaveProperty("password");
    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
  });

  it("deve mapear corretamente quando campos opcionais forem undefined", () => {
    const user = new User();
    user.id = "550e8400-e29b-41d4-a716-446655440000";
    user.name = "Abel Carvalho";
    user.dateBorn = mockDate;
    user.gender = GenderEnum.MALE;
    user.email = "abel@example.com";
    user.username = "abelcarvalho";
    user.password = "hashed_password";
    user.createdAt = mockCreatedAt;
    user.salary = undefined;
    user.phone = undefined;

    const dto = toUserDto(user);

    expect(dto.salary).toBeUndefined();
    expect(dto.phone).toBeUndefined();
    expect(dto).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Abel Carvalho",
      dateBorn: mockDate,
      gender: GenderEnum.MALE,
      email: "abel@example.com",
      username: "abelcarvalho",
      salary: undefined,
      phone: undefined,
      createdAt: mockCreatedAt,
    });
  });
});
