'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import SearchCommunities from './SearchCommunities';

interface Community {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	creatorId: string;
	bountyAmount?: number;
	timeLimit?: number;
	baseFeePercentage?: number;
}

export default function CommunityList() {
	const [communitys, setCommunitys] = useState<Community[]>([]);
	const [filteredCommunitys, setFilteredCommunitys] = useState<Community[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCommunitys = async () => {
		try {
			const { data } = await api.get<Community[]>('/communities');
			setCommunitys(data);
			setFilteredCommunitys(data);
		} catch (error) {
			console.error('Error fetching comunities:', error);
			setError(error instanceof Error ? error.message : 'Failed to load communities');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCommunitys();
	}, []);

	const handleSearch = (searchTerm: string) => {
		if (!searchTerm.trim()) {
			setFilteredCommunitys(communitys);
			return;
		}

		const searchLower = searchTerm.toLowerCase();
		const filtered = communitys.filter((community) => {
			const name = community.name.toLowerCase();

			// 연속된 문자열로 먼저 검색
			if (name.includes(searchLower)) {
				return true;
			}

			// 연속되지 않은 문자열 검색
			let currentIndex = 0;
			for (const char of searchLower) {
				const index = name.indexOf(char, currentIndex);
				if (index === -1) {
					return false;
				}
				currentIndex = index + 1;
			}
			return true;
		});

		setFilteredCommunitys(filtered);
	};

	if (loading) {
		return (
			<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-6">
				<div className="flex justify-center items-center h-40">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-6">
				<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-8">
			<h2 className="text-2xl font-bold tracking-widest uppercase mb-4">Active Communities</h2>
			<hr className="border-black dark:border-white border-1 mb-6" />

			<SearchCommunities onSearch={handleSearch} />

			{filteredCommunitys.length === 0 ? (
				<p className="text-center text-gray-500 dark:text-gray-400 py-8">
					No communities found. Be the first to create one!
				</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{filteredCommunitys.map((room) => (
						<Link key={room.id} href={`/communities/${room.id}`}>
							<div className="border-2 border-black dark:border-white hover:bg-blue-50 dark:hover:bg-gray-700 p-4 transition-colors cursor-pointer h-full flex flex-col">
								<div className="flex justify-between items-start mb-4">
									<h3 className="font-bold text-lg line-clamp-1">{room.name}</h3>
								</div>

								{room.description && (
									<p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 flex-grow">
										{room.description}
									</p>
								)}

								<div className="space-y-2">
									{room.bountyAmount !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-500">total bounty:</span>
											<span className="bg-yellow-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
												{room.bountyAmount} SOL
											</span>
										</div>
									)}

									{room.timeLimit !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-500">time limit:</span>
											<span className="bg-green-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
												{room.timeLimit} MIN
											</span>
										</div>
									)}

									{room.baseFeePercentage !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-500">base fee:</span>
											<span className="bg-blue-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
												{room.baseFeePercentage}%
											</span>
										</div>
									)}

									<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
										<span className="text-xs text-gray-500">created at:</span>
										<span className="text-xs text-gray-500">
											{new Date(room.createdAt).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										</span>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
