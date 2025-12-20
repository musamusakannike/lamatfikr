"use client";

import { useEffect, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { CompanyWalletResponse, CompanyTransactionsResponse, WalletTransaction } from "@/types/admin-wallet";

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-(--bg-card) border border-(--border) rounded-xl p-4 shadow-sm">
            <div className="text-sm text-(--text-muted)">{title}</div>
            <div className="text-2xl font-bold text-(--text) mt-2">{value}</div>
        </div>
    );
}

export default function CompanyWalletPage() {
    const { t, isRTL } = useLanguage();
    const [walletData, setWalletData] = useState<CompanyWalletResponse | null>(null);
    const [transactionsData, setTransactionsData] = useState<CompanyTransactionsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    const limit = 20;

    useEffect(() => {
        let mounted = true;
        const loadWallet = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiClient.get<CompanyWalletResponse>("/wallet/admin/company");
                if (!mounted) return;
                setWalletData(res);
            } catch (e) {
                if (!mounted) return;
                setError(getErrorMessage(e));
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        loadWallet();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const loadTransactions = async () => {
            setLoadingTransactions(true);
            try {
                const res = await apiClient.get<CompanyTransactionsResponse>(
                    `/wallet/admin/company/transactions?page=${page}&limit=${limit}`
                );
                if (!mounted) return;
                setTransactionsData(res);
            } catch (e) {
                if (!mounted) return;
                console.error("Failed to load transactions:", e);
            } finally {
                if (!mounted) return;
                setLoadingTransactions(false);
            }
        };
        loadTransactions();
        return () => {
            mounted = false;
        };
    }, [page]);

    const fmt = (amount: number | undefined, currency: string | undefined) => {
        const a = typeof amount === "number" ? amount : 0;
        const c = currency || "";
        return `${a.toFixed(2)} ${c}`.trim();
    };

    const renderType = (type: string) => {
        if (type === "room_payment") return t("companyWallet", "typeRoomPayment");
        if (type === "product_purchase") return t("companyWallet", "typeProductPurchase");
        if (type === "platform_fee") return t("companyWallet", "typePlatformFee");
        if (type === "withdrawal") return t("companyWallet", "typeWithdrawal");
        if (type === "refund") return t("companyWallet", "typeRefund");
        return type;
    };

    const wallet = walletData?.wallet;
    const currency = wallet?.currency;

    return (
        <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
            <div>
                <h1 className="text-2xl font-bold text-(--text)">{t("companyWallet", "title")}</h1>
                <div className="text-sm text-(--text-muted) mt-1">{t("companyWallet", "subtitle")}</div>
            </div>

            {loading ? <div className="text-(--text-muted)">{t("companyWallet", "loading")}</div> : null}
            {error ? (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                    {t("companyWallet", "failedToLoad")}: {error}
                </div>
            ) : null}

            {!loading && walletData?.success && wallet ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title={t("companyWallet", "balance")} value={fmt(wallet.balance, currency)} />
                        <StatCard title={t("companyWallet", "pendingBalance")} value={fmt(wallet.pendingBalance, currency)} />
                        <StatCard title={t("companyWallet", "totalEarned")} value={fmt(wallet.totalEarned, currency)} />
                        <StatCard title={t("companyWallet", "totalWithdrawn")} value={fmt(wallet.totalWithdrawn, currency)} />
                    </div>

                    <div className="pt-2">
                        <div className="text-lg font-bold text-(--text)">{t("companyWallet", "platformTransactions")}</div>
                        <div className="text-xs text-(--text-muted) mt-1">
                            {t("companyWallet", "lastTransactionAt")}: {wallet.lastTransactionAt ? new Date(wallet.lastTransactionAt).toLocaleString() : "-"}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--bg-card)">
                        <table className="min-w-[980px] w-full text-sm">
                            <thead className="bg-(--bg)">
                                <tr className="text-(--text-muted)">
                                    <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("companyWallet", "colId")}</th>
                                    <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("companyWallet", "colType")}</th>
                                    <th className="px-3 py-3 text-center">{t("companyWallet", "colAmount")}</th>
                                    <th className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{t("companyWallet", "colDescription")}</th>
                                    <th className="px-3 py-3 text-center">{t("companyWallet", "colStatus")}</th>
                                    <th className="px-3 py-3 text-center">{t("companyWallet", "colCreatedAt")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTransactions ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-(--text-muted)">
                                            {t("companyWallet", "loadingTransactions")}
                                        </td>
                                    </tr>
                                ) : (transactionsData?.transactions ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-(--text-muted)">
                                            {t("companyWallet", "noTransactions")}
                                        </td>
                                    </tr>
                                ) : (
                                    (transactionsData?.transactions ?? []).map((tx: WalletTransaction) => (
                                        <tr key={tx._id} className="border-t border-(--border)">
                                            <td className={cn("px-3 py-3 font-mono text-xs", isRTL ? "text-right" : "text-left")}>{tx._id}</td>
                                            <td className={cn("px-3 py-3", isRTL ? "text-right" : "text-left")}>{renderType(tx.type)}</td>
                                            <td className="px-3 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                                                +{fmt(tx.amount, tx.currency)}
                                            </td>
                                            <td className={cn("px-3 py-3 max-w-[520px]", isRTL ? "text-right" : "text-left")}>
                                                <div className="truncate text-(--text)">{tx.description}</div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    tx.status === "completed"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                )}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {transactionsData && transactionsData.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-(--text-muted)">
                                {t("companyWallet", "showingPage")} {transactionsData.page} {t("companyWallet", "of")} {transactionsData.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                                        page === 1
                                            ? "border-(--border) text-(--text-muted) cursor-not-allowed opacity-50"
                                            : "border-(--border) text-(--text) hover:bg-(--bg) hover:border-primary-500"
                                    )}
                                >
                                    {t("companyWallet", "previous")}
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(transactionsData.totalPages, p + 1))}
                                    disabled={page === transactionsData.totalPages}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                                        page === transactionsData.totalPages
                                            ? "border-(--border) text-(--text-muted) cursor-not-allowed opacity-50"
                                            : "border-(--border) text-(--text) hover:bg-(--bg) hover:border-primary-500"
                                    )}
                                >
                                    {t("companyWallet", "next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
