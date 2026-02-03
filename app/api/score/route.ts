import { NextRequest, NextResponse } from "next/server";
import { validateAddress } from "@/lib/utils/validation";
import { alchemyClient } from "@/lib/blockchain/alchemy";
import { scoreCache } from "@/lib/cache/cache";
import { processTransactions, calculateScore } from "@/lib/scoring/calculator";
import { ScoreResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 },
      );
    }

    const validation = validateAddress(address);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const normalizedAddress = validation.normalized!;

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
