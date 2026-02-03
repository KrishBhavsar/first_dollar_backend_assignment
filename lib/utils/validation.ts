import { isAddress } from "ethers";
import { z } from "zod";
import { isBasename } from "@/lib/blockchain/basename";

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

/**
 * Validate input that could be either an Ethereum address or a basename.
 * Returns the type of input detected.
 */
export function validateInput(input: string): {
  type: "address" | "basename" | "invalid";
  normalized?: string;
  error?: string;
} {
  const trimmed = input.trim();

  // Check if it's a valid Ethereum address
  if (isAddress(trimmed)) {
    return { type: "address", normalized: normalizeAddress(trimmed) };
  }

  // Check if it looks like a basename (use original input to avoid type narrowing from isAddress)
  if (isBasename(input.trim())) {
    return { type: "basename", normalized: input.trim().toLowerCase() };
  }

  return { type: "invalid", error: "Invalid input. Provide an Ethereum address (0x...) or a Basename (e.g. alice or alice.base.eth)" };
}
