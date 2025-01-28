
import ChatBase from "@/components/chat/ChatBase";
import { fetchChats } from "@/fetch/chatsFetch";
import { fetchChatGroup, fetchChatGroupUsers } from "@/fetch/groupFetch";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function Chat({ params }: { params: { id: string } }) {
	const { id } = params;

	if (!id || id.length !== 36) {
		return notFound();
	}

	try {
		const [chatGroup, chatGroupUsers, chats] = await Promise.all([
			fetchChatGroup(id),
			fetchChatGroupUsers(id),
			fetchChats(id),
		]);

		if (!chatGroup) {
			return notFound();
		}

		return (
			<Suspense fallback={<div>Loading...</div>}>
				<ChatBase group={chatGroup} users={chatGroupUsers} oldMessages={chats} />
			</Suspense>
		);
	} catch (error) {
		console.error("Error fetching chat data:", error);
		return notFound();
	}
}

