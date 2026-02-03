import { namehash, ZeroAddress } from "ethers";
import { ALCHEMY_BASE_URL } from "../constants";

// Base mainnet L2 resolver contract for .base.eth names
const BASE_L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

// ABI-encoded function selector for addr(bytes32)
const ADDR_SELECTOR = "0x3b3b57de";

/**
 * Check if a string looks like a basename (e.g. "alice" or "alice.base.eth")
 */
export function isBasename(input: string): boolean {
  const trimmed = input.trim().toLowerCase();

  // Already has .base.eth suffix
  if (trimmed.endsWith(".base.eth")) {
    return true;
  }

  // Plain name without dots and not a hex address
  if (!trimmed.startsWith("0x") && !trimmed.includes(".") && /^[a-z0-9-]+$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Normalize basename input to full .base.eth format
 */
function normalizeBasename(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.endsWith(".base.eth")) {
    return trimmed;
  }
  return `${trimmed}.base.eth`;
}

/**
 * Resolve a basename to an Ethereum address using the Base L2 resolver contract.
 * Queries the resolver directly on Base mainnet via Alchemy.
 */
export async function resolveBasename(input: string): Promise<{
  address: string | null;
  basename: string;
  error?: string;
}> {
  const basename = normalizeBasename(input);

  try {
    const apiKey = process.env.ALCHEMY_API_KEY || "";
    if (!apiKey) {
      return { address: null, basename, error: "ALCHEMY_API_KEY not configured" };
    }

    const baseUrl = `${ALCHEMY_BASE_URL}/${apiKey}`;

    // Compute the namehash for the basename
    const node = namehash(basename);

    // ABI-encode the call: addr(bytes32 node)
    // selector (4 bytes) + node (32 bytes, already 0x-prefixed hex)
    const data = ADDR_SELECTOR + node.slice(2);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: BASE_L2_RESOLVER,
            data,
          },
          "latest",
        ],
      }),
    });

    if (!response.ok) {
      return { address: null, basename, error: `Alchemy API error: ${response.statusText}` };
    }

    const result = await response.json();

    if (result.error) {
      return { address: null, basename, error: `Resolver error: ${result.error.message}` };
    }

    // The result is a 32-byte ABI-encoded address (last 20 bytes are the address)
    const rawAddress = result.result;

    if (!rawAddress || rawAddress === "0x" || rawAddress.length < 66) {
      return { address: null, basename, error: `Basename "${basename}" not found` };
    }

    // Extract address from the 32-byte response (take the last 40 hex chars)
    const resolved = "0x" + rawAddress.slice(-40);

    if (resolved === ZeroAddress) {
      return { address: null, basename, error: `Basename "${basename}" has no address set` };
    }

    return { address: resolved, basename };
  } catch (error: any) {
    return { address: null, basename, error: error.message || "Failed to resolve basename" };
  }
}
