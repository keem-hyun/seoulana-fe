'use client';

import { useState } from 'react';
import { api } from '@/api';

type CreateMessageFormProps = {
	communityId: string;
	onMessageSent?: () => void;
};

export default function CreateMessageForm({ communityId, onMessageSent }: CreateMessageFormProps) {
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		setLoading(true);
		setError(null);

		try {
			const { data } = await api.post('/messages', {
				content,
				communityId,
			});
			onMessageSent && onMessageSent();
			setContent('');
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
					disabled={loading}
					className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
				/>
				<button
					type="submit"
					disabled={loading || !content.trim()}
					className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Sending...' : 'Send'}
				</button>
			</div>
		</form>
	);
}
