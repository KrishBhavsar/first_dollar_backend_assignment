import { isAddress } from "ethers";
import { z } from "zod";

export const addressSchema = z
  .string()
  .refine((addr) => isAddress(addr), { message: "Invalid Ethereum address" });

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function validateAddress(address: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  try {
    addressSchema.parse(address);
    return {
      valid: true,
      normalized: normalizeAddress(address),
    };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid Ethereum address format",
    };
  }
}
