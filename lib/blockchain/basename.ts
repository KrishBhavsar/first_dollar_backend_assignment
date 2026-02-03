import { namehash, ZeroAddress } from "ethers";
import { ALCHEMY_BASE_URL } from "../constants";

const BASE_L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

const ADDR_SELECTOR = "0x3b3b57de";

export function isBasename(input: string): boolean {
  const trimmed = input.trim().toLowerCase();

  if (trimmed.endsWith(".base.eth")) {
    return true;
  }

  if (
    !trimmed.startsWith("0x") &&
    !trimmed.includes(".") &&
    /^[a-z0-9-]+$/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

function normalizeBasename(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.endsWith(".base.eth")) {
    return trimmed;
  }
  return `${trimmed}.base.eth`;
}

export async function resolveBasename(input: string): Promise<{
  address: string | null;
  basename: string;
  error?: string;
}> {
  const basename = normalizeBasename(input);

  try {
    const apiKey = process.env.ALCHEMY_API_KEY || "";
    if (!apiKey) {
      return {
        address: null,
        basename,
        error: "ALCHEMY_API_KEY not configured",
      };
    }

    const baseUrl = `${ALCHEMY_BASE_URL}/${apiKey}`;

    const node = namehash(basename);

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
      return {
        address: null,
        basename,
        error: `Alchemy API error: ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.error) {
      return {
        address: null,
        basename,
        error: `Resolver error: ${result.error.message}`,
      };
    }

    const rawAddress = result.result;

    if (!rawAddress || rawAddress === "0x" || rawAddress.length < 66) {
      return {
        address: null,
        basename,
        error: `Basename "${basename}" not found`,
      };
    }

    const resolved = "0x" + rawAddress.slice(-40);

    if (resolved === ZeroAddress) {
      return {
        address: null,
        basename,
        error: `Basename "${basename}" has no address set`,
      };
    }

    return { address: resolved, basename };
  } catch (error: any) {
    return {
      address: null,
      basename,
      error: error.message || "Failed to resolve basename",
    };
  }
}
