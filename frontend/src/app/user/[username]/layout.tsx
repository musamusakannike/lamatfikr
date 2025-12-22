import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;

    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
        const res = await fetch(`${API_URL}/profile/user/${username}`);
        const data = await res.json();
        const profile = data.profile;

        if (!profile) {
            return {
                title: "User Not Found",
            };
        }

        const title = `${profile.firstName} ${profile.lastName} (@${profile.username}) on LamatFikr`;
        const description = profile.bio || `Check out ${profile.firstName}'s profile on LamatFikr`;
        const images = profile.avatar ? [profile.avatar] : ["/images/default-og.png"];

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images,
                type: "profile",
            },
            twitter: {
                card: "summary",
                title,
                description,
                images,
            },
        };
    } catch (error) {
        return {
            title: "LamatFikr User Profile",
        };
    }
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
