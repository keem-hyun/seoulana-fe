'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MessageList from '@/components/MessageList';
import CreateMessageForm from '@/components/CreateMessageForm';
import { api } from '@/api';

type User = {
	id: string;
	username: string;
};

type Community = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	creatorId: string;
	creator: {
		id: string;
		username: string;
	};
	messages: Message[];
};

type Message = {
	id: string;
	content: string;
	createdAt: string;
	userId: string;
	communityId: string;
	user: {
		id: string;
		username: string;
	};
};

export default function CommunityPage() {
	const params = useParams();
	const communityId = params.id as string;

	const [user, setUser] = useState<User | null>(null);
	const [community, setCommunity] = useState<Community | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		async function fetchData() {
			try {
				const [userResponse, messagesResponse] = await Promise.all([
					api.get<User>('/auth/user'),
					api.get<Message[]>(`/communities/${communityId}/messages`),
				]);
				setUser(userResponse.data);
				setMessages(messagesResponse.data);
			} catch (error) {
				console.error('Error fetching data:', error);
				setError(error instanceof Error ? error.message : 'An unknown error occurred');
			} finally {
				setLoading(false);
			}
		}

		fetchData();

		// Set up polling for new messages every 5 seconds
		const intervalId = setInterval(() => {
			if (!loading && !error) {
				fetchMessages();
			}
		}, 5000);

		return () => clearInterval(intervalId);
	}, [communityId]);

	const fetchMessages = async () => {
		try {
			const { data } = await api.get<Message[]>(`/communities/${communityId}/messages`);
			setMessages(data);
			setCommunity((prev) =>
				prev
					? {
							...prev,
							messages: data,
					  }
					: null
			);
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
			</div>
		);
	}

	if (error || !community) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-6 text-red-800 dark:text-red-300">
					<h2 className="text-xl font-semibold mb-2">Error</h2>
					<p>{error || 'Community not found'}</p>
					<Link
						href="/communities"
						className="mt-4 inline-block bg-red-100 dark:bg-red-800 px-4 py-2 rounded-md text-sm"
					>
						Back to Game Rooms
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<Link href="/communities" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
					← Back to Game Rooms
				</Link>
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">{community.name}</h1>
					{user ? (
						<p className="text-sm">
							Logged in as <span className="font-semibold">@{user.username}</span>
						</p>
					) : (
						<Link
							href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login/twitter`}
							className="bg-black text-white px-4 py-2 rounded-full text-sm"
						>
							Login with X
						</Link>
					)}
				</div>
				{community.description && <p className="text-gray-600 dark:text-gray-400 mt-2">{community.description}</p>}
			</div>

			<div className="grid grid-cols-1 gap-8">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
					<div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
						<h2 className="text-xl font-semibold">Messages</h2>
					</div>
					<div className="p-4">
						<MessageList messages={messages || []} currentUserId={user?.id} />
					</div>
					<div className="p-4 border-t border-gray-200 dark:border-gray-700">
						{user ? (
							<CreateMessageForm communityId={community.id} onMessageSent={fetchMessages} />
						) : (
							<div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 text-yellow-800 dark:text-yellow-300">
								Please log in to send messages.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
