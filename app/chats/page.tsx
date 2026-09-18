import { redirect } from "next/navigation";

type LegacyChatsPageProps = {
  searchParams: Promise<{ conversation?: string }>;
};

export default async function LegacyChatsRedirect({ searchParams }: LegacyChatsPageProps) {
  const { conversation } = await searchParams;
  const destination = conversation
    ? `/chat?tab=messages&conversation=${encodeURIComponent(conversation)}`
    : "/chat?tab=messages";
  redirect(destination);
}
