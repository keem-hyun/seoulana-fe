'use client';

import Link from 'next/link';
import { Clock, Percent, Coins, NotebookTabs } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CommunityCardProps {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	creatorId: string;
	bountyAmount?: number;
	timeLimit?: number;
	baseFeePercentage?: number;
	lastMessageTime?: string | null;
}

export default function CommunityCard({
	id,
	name,
	description,
	createdAt,
	creatorId,
	bountyAmount,
	timeLimit,
	baseFeePercentage,
	lastMessageTime: initialLastMessageTime,
}: CommunityCardProps) {
	// Use the WebSocket hook to get real-time updates
	const { lastMessageTime: wsLastMessageTime } = useWebSocket(id);
	const [displayedLastMessageTime, setDisplayedLastMessageTime] = useState<string | null>(
		initialLastMessageTime || null
	);
	const [secondsCounter, setSecondsCounter] = useState<number>(0);
	const [remainingTimeText, setRemainingTimeText] = useState<string>('');

	// Update displayed time when WebSocket updates come in
	useEffect(() => {
		if (wsLastMessageTime) {
			setDisplayedLastMessageTime(wsLastMessageTime);
		}
	}, [wsLastMessageTime]);

	// Update timer every second for real-time countdown
	useEffect(() => {
		const timer = setInterval(() => {
			setSecondsCounter((prev) => prev + 1);
			updateRemainingTime();
		}, 1000);

		return () => clearInterval(timer);
	}, [displayedLastMessageTime, timeLimit]);

	// Calculate and update the remaining time text
	const updateRemainingTime = () => {
		if (!timeLimit || !displayedLastMessageTime) {
			setRemainingTimeText(timeLimit ? `${timeLimit}m (inactive)` : '-');
			return;
		}

		const lastMessageDate = new Date(displayedLastMessageTime);
		const now = new Date();
		const elapsedMsSinceLastMessage = now.getTime() - lastMessageDate.getTime();

		// Convert time limit from minutes to milliseconds
		const timeLimitMs = timeLimit * 60 * 1000;

		// Calculate remaining time in milliseconds
		const remainingMs = Math.max(0, timeLimitMs - elapsedMsSinceLastMessage);

		if (remainingMs <= 0) {
			setRemainingTimeText('Expired');
			return;
		}

		// Convert to minutes and seconds
		const remainingMins = Math.floor(remainingMs / 60000);
		const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

		// Format the time string
		if (remainingMins > 0) {
			setRemainingTimeText(`${remainingMins}m ${remainingSecs}s`);
		} else {
			setRemainingTimeText(`${remainingSecs}s`);
		}
	};

	// Initialize remaining time on mount
	useEffect(() => {
		updateRemainingTime();
	}, [displayedLastMessageTime, timeLimit]);

	const formatTimestamp = (timestamp: string | null) => {
		if (!timestamp) return 'No messages yet';

		const messageDate = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - messageDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		return messageDate.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Link href={`/communities/${id}`}>
			<div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md group transition-all duration-300 h-full flex flex-col border border-gray-200 dark:border-gray-700">
				<div className="bg-pink-50 p-5 transition-all duration-300">
					<h3 className="font-bold text-lg line-clamp-1 text-gray-800 dark:text-white">{name}</h3>
				</div>

				<div className="p-5 flex-grow flex flex-col">
					<div className="flex items-start mb-4">
						<NotebookTabs size={14} className="text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
						<p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{description || '-'}</p>
					</div>

					<div className="space-y-3 mb-auto">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
								<Coins size={14} className="mr-1.5 text-yellow-500" /> total bounty:
							</span>
							<span
								className={`${
									bountyAmount !== undefined
										? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
										: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
								} px-3 py-1 text-xs font-medium rounded-full`}
							>
								{bountyAmount !== undefined ? `${bountyAmount} SOL` : '-'}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
								<Clock size={14} className="mr-1.5 text-green-500" /> time left:
							</span>
							{timeLimit !== undefined && (
								<span
									className={`px-3 py-1 text-xs font-medium rounded-full ${
										displayedLastMessageTime
											? remainingTimeText === 'Expired'
												? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
												: remainingTimeText.includes('m') && parseInt(remainingTimeText.split('m')[0]) <= 5
												? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
												: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
											: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
									}`}
								>
									{remainingTimeText}
								</span>
							)}
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
								<Percent size={14} className="mr-1.5 text-blue-500" /> base fee:
							</span>
							<span
								className={`${
									baseFeePercentage !== undefined
										? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
										: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
								} px-3 py-1 text-xs font-medium rounded-full`}
							>
								{baseFeePercentage !== undefined && baseFeePercentage !== null ? `${baseFeePercentage} SOL` : '0 SOL'}
							</span>
						</div>
					</div>

					<div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
						<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
							<span>created:</span>
							<span>
								{new Date(createdAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})}
							</span>
						</div>

						<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
							<span>last activity:</span>
							<span>{formatTimestamp(displayedLastMessageTime)}</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
