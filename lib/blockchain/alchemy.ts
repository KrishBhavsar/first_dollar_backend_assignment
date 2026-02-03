import { AlchemyTransaction } from "@/types";
import { ALCHEMY_BASE_URL } from "../constants";

export class AlchemyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ALCHEMY_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("ALCHEMY_API_KEY not configured");
    }
    this.baseUrl = `${ALCHEMY_BASE_URL}/${this.apiKey}`;
  }

  async getTransactionHistory(address: string): Promise<AlchemyTransaction[]> {
    const allTransactions: AlchemyTransaction[] = [];
    let pageKey: string | undefined = undefined;

    try {
      do {
        const response: Response = await fetch(this.baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [
              {
                fromAddress: address,
                category: [
                  "external",
                  "erc20",
                  "erc721",
                  "erc1155",
                ],
                withMetadata: true,
                maxCount: "0x3e8", // 1000 in hex
                ...(pageKey && { pageKey }),
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Alchemy API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(`Alchemy API error: ${data.error.message}`);
        }

        const transfers = data.result.transfers || [];
        allTransactions.push(...transfers);

        pageKey = data.result.pageKey;
      } while (pageKey);

      return allTransactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }
}

export const alchemyClient = new AlchemyClient();
