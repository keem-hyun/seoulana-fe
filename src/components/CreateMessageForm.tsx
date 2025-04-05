'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';

type CreateMessageFormProps = {
	communityId: string;
	onMessageSent?: () => void;
};

export default function CreateMessageForm({ communityId, onMessageSent }: CreateMessageFormProps) {
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [communityData, setCommunityData] = useState<any>(null);
	const messageSentRef = useRef(false);

	// Fetch the actual community data to get its UUID
	useEffect(() => {
		const fetchCommunityData = async () => {
			try {
				const { data } = await api.get(`/communities/${communityId}/messages`);
				setCommunityData(data);
				console.log('Community data loaded:', data);
			} catch (err) {
				console.error('Error fetching community data:', err);
				setError('Could not load community data. Please refresh the page.');
			}
		};

		fetchCommunityData();
	}, [communityId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;
		if (!communityData?.id) {
			setError('Community data not loaded yet. Please wait or refresh the page.');
			return;
		}

		setLoading(true);
		setError(null);
		// Reset the message sent flag
		messageSentRef.current = false;

		try {
			console.log('Sending message with data:', {
				content,
				communityId: communityData.id,
			});

			const { data } = await api.post('/messages', {
				content,
				communityId: communityData.id, // Use the real UUID
			});

			console.log('Message sent successfully:', data);
			setContent('');

			// Use a flag to ensure callback is only called once
			if (!messageSentRef.current && onMessageSent) {
				messageSentRef.current = true;
				// Delay the callback to avoid React state updates during render
				setTimeout(() => {
					onMessageSent();
				}, 0);
			}
		} catch (error) {
			console.error('Error creating message:', error);
			setError(error instanceof Error ? error.message : 'Failed to send message');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			{error && (
				<div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-2 text-red-800 dark:text-red-300 text-sm">
					{error}
				</div>
			)}

			<div className="flex">
				<input
					type="text"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Type your message..."
					disabled={loading || !communityData}
					className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
				/>
				<button
					type="submit"
					disabled={loading || !content.trim() || !communityData}
					className="bg-[rgba(255,182,193,0.5)] hover:bg-[rgba(255,182,193,0.6)] text-black font-medium py-2 px-4 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Sending...' : 'Send'}
				</button>
			</div>
			{!communityData && <div className="text-xs text-gray-500">Loading community data...</div>}
		</form>
	);
}
