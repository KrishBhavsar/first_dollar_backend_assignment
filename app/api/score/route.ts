import { NextRequest, NextResponse } from "next/server";
import { validateInput, normalizeAddress } from "@/lib/utils/validation";
import { resolveBasename } from "@/lib/blockchain/basename";
import { alchemyClient } from "@/lib/blockchain/alchemy";
import { scoreCache } from "@/lib/cache/cache";
import { processTransactions, calculateScore } from "@/lib/scoring/calculator";
import { ScoreResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get("address");

    if (!input) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 },
      );
    }

    const validation = validateInput(input);

    if (validation.type === "invalid") {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let normalizedAddress: string;
    let basename: string | undefined;

    if (validation.type === "basename") {
      // Resolve basename to address
      const resolution = await resolveBasename(validation.normalized!);

      if (!resolution.address) {
        return NextResponse.json(
          { error: resolution.error || "Failed to resolve basename" },
          { status: 400 },
        );
      }

      normalizedAddress = normalizeAddress(resolution.address);
      basename = resolution.basename;
    } else {
      normalizedAddress = validation.normalized!;
    }

    const cachedScore = scoreCache.get(normalizedAddress);
    if (cachedScore) {
      return NextResponse.json(cachedScore);
    }

    let transactions;
    try {
      transactions =
        await alchemyClient.getTransactionHistory(normalizedAddress);
    } catch (error: any) {
      console.error("Blockchain API error:", error);

      if (error.message?.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limited. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch transaction data" },
        { status: 500 },
      );
    }

    const stats = processTransactions(transactions);
    const { score, breakdown, flags } = calculateScore(stats);

    const response: ScoreResponse = {
      address: normalizedAddress,
      ...(basename && { basename }),
      score,
      breakdown,
      stats: {
        totalTransactions: stats.totalTransactions,
        uniqueActiveDays: stats.uniqueActiveDays,
        longestStreak: stats.longestStreak,
        firstTxAt: stats.firstTxAt,
        lastTxAt: stats.lastTxAt,
        uniqueContracts: stats.uniqueContracts,
        daysSinceFirstTx: stats.daysSinceFirstTx,
      },
      ...(flags && { flags }),
    };

    scoreCache.set(normalizedAddress, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
