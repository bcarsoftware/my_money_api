import { Pix } from "@/entities/Pix";
import { PixDto } from "./PixDto";

export const toPixDto = (pix: Pix): PixDto => ({
  id: pix.id,
  bankId: pix.bankId,
  tag: pix.tag,
  description: pix.description,
  typeKey: pix.typeKey,
  key: pix.key,
  createdAt: pix.createdAt,
});
