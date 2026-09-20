import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from "uuid";

type UUIDVersion = 1 | 4 | 7;

export const randomUUID = (version: UUIDVersion): string => {
  switch (version) {
    case 1:
      return uuidv1().toString();
    case 4:
      return uuidv4().toString();
    case 7:
      return uuidv7().toString();
    default:
      throw new Error(`Unsupported UUID version: ${version}`);
  }
};
