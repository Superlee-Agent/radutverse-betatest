import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, AlertCircle, Wallet } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { SearchResult } from "@/components/search-feature/types";

interface TokenBalance {
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string;
}

const MyPortfolio = () => {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [ipAssets, setIpAssets] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);

  // Get user wallet address
  useEffect(() => {
    if (authenticated && wallets && wallets.length > 0) {
      const walletWithAddress = wallets.find((wallet) => wallet.address);
      if (walletWithAddress?.address) {
        setUserAddress(walletWithAddress.address);
      }
    }
  }, [authenticated, wallets]);

  // Fetch token balance and IP assets
  useEffect(() => {
    if (!userAddress) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch IP Assets
        const assetsResponse = await fetch("/api/search-by-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: userAddress }),
        });

        if (!assetsResponse.ok) {
          const errorData = await assetsResponse.json();
          throw new Error(errorData.message || "Failed to fetch IP assets");
        }

        const assetsData = await assetsResponse.json();
        setIpAssets(assetsData.results || []);

        // Fetch token balance using Story Protocol RPC
        const rpcUrl =
          process.env.VITE_PUBLIC_STORY_RPC || "https://aeneid.storyrpc.io";

        // WIP Token address on Story Protocol
        const wipTokenAddress = "0x91ecf2d7f0b1bad77592f90a5f46a5e7fef5e7f2";

        // ERC20 ABI for balanceOf
        const abi = [
          {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
          {
            name: "decimals",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "uint8" }],
          },
          {
            name: "symbol",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "string" }],
          },
        ];

        // Fetch token balance
        try {
          const balanceResult = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_call",
              params: [
                {
                  to: wipTokenAddress,
                  data: `0x70a08231000000000000000000000000${userAddress.slice(2)}`,
                },
                "latest",
              ],
              id: 1,
            }),
          });

          const balanceData = await balanceResult.json();
          if (balanceData.result && balanceData.result !== "0x") {
            const balanceHex = balanceData.result;
            const balanceBigInt = BigInt(balanceHex);
            const formattedBalance = (Number(balanceBigInt) / 1e18).toFixed(2);

            setTokenBalance({
              balance: balanceBigInt.toString(),
              decimals: 18,
              symbol: "WIP",
              formatted: formattedBalance,
            });
          } else {
            setTokenBalance({
              balance: "0",
              decimals: 18,
              symbol: "WIP",
              formatted: "0.00",
            });
          }
        } catch (balanceError) {
          console.warn("Failed to fetch token balance:", balanceError);
          setTokenBalance({
            balance: "0",
            decimals: 18,
            symbol: "WIP",
            formatted: "0.00",
          });
        }
      } catch (err) {
        console.error("Error fetching portfolio data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userAddress]);

  if (!ready) {
    return (
      <DashboardLayout title="My Portfolio">
        <div className="flex items-center justify-center h-full">
          <Loader className="h-6 w-6 animate-spin text-[#FF4DA6]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!authenticated) {
    return (
      <DashboardLayout title="My Portfolio">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-4"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-[#FF4DA6]/20 border border-[#FF4DA6]/30"
            >
              <Wallet className="h-10 w-10 text-[#FF4DA6]" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-md">
                Please connect your wallet to view your portfolio, including
                your token balance and IP assets.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => login()}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#FF4DA6] to-[#FF4DA6]/80 text-white font-semibold shadow-lg shadow-[#FF4DA6]/30 hover:shadow-xl hover:shadow-[#FF4DA6]/40 transition-all"
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Portfolio">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex flex-col gap-6 pb-4"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">My Portfolio</h1>
            <p className="text-slate-400 text-sm">
              {userAddress && (
                <>
                  Connected wallet:{" "}
                  <span className="font-mono text-slate-300">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold">Error</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Token Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Token Balance</p>
              <h3 className="text-3xl sm:text-4xl font-bold text-white">
                {loading ? (
                  <Loader className="h-8 w-8 animate-spin" />
                ) : tokenBalance ? (
                  <>
                    {tokenBalance.formatted}{" "}
                    <span className="text-xl text-[#FF4DA6]">
                      {tokenBalance.symbol}
                    </span>
                  </>
                ) : (
                  "0.00 WIP"
                )}
              </h3>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-[#FF4DA6]/10 border border-[#FF4DA6]/20"
            >
              <svg
                className="h-8 w-8 text-[#FF4DA6]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* IP Assets Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 flex-1"
        >
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Your IP Assets
            </h2>
            <p className="text-slate-400 text-sm">
              You own {ipAssets.length} IP{" "}
              {ipAssets.length === 1 ? "asset" : "assets"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader className="h-8 w-8 animate-spin text-[#FF4DA6]" />
                <p className="text-slate-400">Loading your IP assets...</p>
              </div>
            </div>
          ) : ipAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1 pr-2">
              <AnimatePresence>
                {ipAssets.map((asset, index) => (
                  <motion.div
                    key={asset.ipId || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredAssetId(asset.ipId || null)}
                    onMouseLeave={() => setHoveredAssetId(null)}
                    className="group flex flex-col h-full cursor-pointer"
                  >
                    {/* Asset Thumbnail */}
                    <div className="relative w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 hover:-translate-y-1 border border-slate-700/50">
                      {asset.mediaUrl ? (
                        asset.mediaType?.startsWith("video") ? (
                          <div className="w-full h-full relative group/video">
                            <video
                              src={asset.mediaUrl}
                              poster={asset.thumbnailUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/video:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/video:opacity-100">
                              <div className="w-12 h-12 rounded-full bg-[#FF4DA6] flex items-center justify-center shadow-2xl">
                                <svg
                                  className="w-6 h-6 text-white fill-current ml-1"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M3 3v18h18V3H3zm9 14V7l5 5-5 5z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white">
                              VIDEO
                            </div>
                          </div>
                        ) : asset.mediaType?.startsWith("audio") ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-900/80 via-purple-800/40 to-slate-900">
                            <svg
                              className="w-12 h-12 text-purple-300"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                            <span className="text-xs text-purple-200 font-semibold">
                              AUDIO
                            </span>
                          </div>
                        ) : (
                          <img
                            src={asset.mediaUrl}
                            alt={asset.title || asset.name || "IP Asset"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const parent = img.parentElement;
                              if (
                                parent &&
                                parent.querySelector("img") === img
                              ) {
                                img.replaceWith(
                                  Object.assign(document.createElement("div"), {
                                    className:
                                      "w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-800",
                                    innerHTML: `
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-xs">Failed to load</span>
                                  `,
                                  }),
                                );
                              }
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-800">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-xs">No media</span>
                        </div>
                      )}

                      {hoveredAssetId === asset.ipId && (
                        <div className="absolute inset-0 ring-2 ring-[#FF4DA6]/60 rounded-lg pointer-events-none" />
                      )}
                    </div>

                    {/* Asset Info */}
                    <div className="pt-3 space-y-2 flex flex-col flex-grow">
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-[#FF4DA6] transition-colors duration-200">
                        {asset.title || asset.name || "Untitled Asset"}
                      </h3>

                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap backdrop-blur-sm ${
                            asset.isDerivative
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {asset.isDerivative ? "🔄 Remix" : "✨ Original"}
                        </span>

                        {asset.mediaType && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/50 font-semibold whitespace-nowrap backdrop-blur-sm">
                            {asset.mediaType
                              .replace("video/", "")
                              .replace("audio/", "")
                              .replace("image/", "")
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      {asset.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {asset.description}
                        </p>
                      )}

                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                        <p className="text-slate-400 font-mono text-[0.65rem] break-all">
                          {asset.ipId}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-slate-700/50 bg-slate-900/20">
              <svg
                className="h-12 w-12 text-slate-500 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-slate-400 text-sm font-medium">
                No IP assets yet
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Create or register your first IP asset to see it here
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyPortfolio;
