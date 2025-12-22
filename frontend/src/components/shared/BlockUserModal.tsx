"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { socialApi } from "@/lib/api/social";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    username: string;
    isBlocked: boolean;
    onSuccess?: (isBlocked: boolean) => void;
}

export function BlockUserModal({ isOpen, onClose, userId, username, isBlocked, onSuccess }: BlockUserModalProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async () => {
        try {
            setIsLoading(true);
            if (isBlocked) {
                await socialApi.unblockUser(userId);
                toast.success(`${t("blockModal", "successUnblock")} @${username}`);
                onSuccess?.(false);
            } else {
                await socialApi.blockUser(userId);
                toast.success(`${t("blockModal", "successBlock")} @${username}`);
                onSuccess?.(true);
            }
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const title = isBlocked
        ? `${t("blockModal", "titleUnblock")} @${username}?`
        : `${t("blockModal", "titleBlock")} @${username}?`;

    const message = isBlocked
        ? t("blockModal", "messageUnblock")
        : t("blockModal", "messageBlock");

    const buttonText = isLoading
        ? (isBlocked ? t("blockModal", "btnUnblocking") : t("blockModal", "btnBlocking"))
        : (isBlocked ? t("blockModal", "btnUnblock") : t("blockModal", "btnBlock"));

    const variant = isBlocked ? "primary" : "danger";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-4 space-y-4">
                <p>{message}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>{t("blockModal", "cancel")}</Button>
                    <Button variant={variant} onClick={handleAction} disabled={isLoading}>
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
