'use client';

import Link from 'next/link';
import { Clock, Percent, Coins, NotebookTabs } from 'lucide-react';

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
	lastMessageTime,
}: CommunityCardProps) {
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
								<Clock size={14} className="mr-1.5 text-green-500" /> time limit:
							</span>
							<span
								className={`${
									timeLimit !== undefined
										? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
										: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
								} px-3 py-1 text-xs font-medium rounded-full`}
							>
								{timeLimit !== undefined ? `${timeLimit} MIN` : '-'}
							</span>
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
								{baseFeePercentage !== undefined ? `${baseFeePercentage}%` : '-'}
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
							<span>
								{lastMessageTime
									? new Date(lastMessageTime).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
									  })
									: '-'}
							</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
