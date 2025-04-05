'use client';

import { useEffect, useState } from 'react';
import { api } from '@/api';
import SearchCommunities from './SearchCommunities';
import CommunityCard from './CommunityCard';

interface Community {
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
			console.error('Error fetching communities:', error);
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
					{filteredCommunitys.map((community) => (
						<CommunityCard
							key={community.id}
							id={community.id}
							name={community.name}
							description={community.description}
							createdAt={community.createdAt}
							creatorId={community.creatorId}
							bountyAmount={community.bountyAmount}
							timeLimit={community.timeLimit}
							baseFeePercentage={community.baseFeePercentage}
							lastMessageTime={community.lastMessageTime}
						/>
					))}
				</div>
			)}
		</div>
	);
}
