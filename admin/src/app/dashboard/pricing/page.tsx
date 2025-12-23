"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
    const { t, isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        price_featured_room_per_day: 10,
        price_verification: 0,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiClient.get<{ settings: any }>("/admin/settings");
            if (data.settings) {
                setSettings({
                    price_featured_room_per_day: data.settings.price_featured_room_per_day ?? 10,
                    price_verification: data.settings.price_verification ?? 0,
                });
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.post("/admin/settings", { settings });
            toast.success(t("adminPricing", "saveSuccess"));
        } catch (error) {
            toast.error(t("adminPricing", "saveError"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-(--text-muted)">{t("adminPricing", "loading") || "Loading..."}</div>
    }

    return (
        <div className={cn("space-y-6", isRTL ? "text-right" : "text-left")}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-(--text)">{t("adminPricing", "title")}</h1>
                    <p className="text-(--text-muted)">
                        {t("adminPricing", "subtitle")}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="bg-(--bg-card) border border-(--border) rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-(--border)">
                        <div className="flex items-center gap-2 text-lg font-semibold text-(--text)">
                            <DollarSign className="w-5 h-5 text-primary-500" />
                            {t("adminPricing", "title")}
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-(--text)">
                                    {t("adminPricing", "priceFeaturedRoomPerDay")}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={settings.price_featured_room_per_day}
                                        onChange={(e) => setSettings({ ...settings, price_featured_room_per_day: parseFloat(e.target.value) || 0 })}
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 text-(--text)",
                                            isRTL ? "pl-12" : "pr-12"
                                        )}
                                    />
                                    <div className={`absolute top-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} h-full flex items-center pointer-events-none text-(--text-muted) text-sm`}>
                                        {t("adminPricing", "currency")}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-(--text)">
                                    {t("adminPricing", "priceVerification")}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={settings.price_verification}
                                        onChange={(e) => setSettings({ ...settings, price_verification: parseFloat(e.target.value) || 0 })}
                                        className={cn(
                                            "flex h-10 w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 text-(--text)",
                                            isRTL ? "pl-12" : "pr-12"
                                        )}
                                    />
                                    <div className={`absolute top-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} h-full flex items-center pointer-events-none text-(--text-muted) text-sm`}>
                                        {t("adminPricing", "currency")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white">
                                {saving && <span className="animate-spin mr-2">⏳</span>}
                                {saving ? t("adminPricing", "saving") : t("adminPricing", "save")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
