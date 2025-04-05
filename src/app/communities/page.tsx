'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CommunityCard from '@/components/communities/CommunityCard';
import SearchCommunities from '@/components/communities/SearchCommunities';
import CreateCommunityDialog from '@/components/communities/CreateCommunityDialog';
import LinkWalletButton from '@/components/wallet/LinkWalletButton';
import { toast, Toaster } from 'react-hot-toast';
import { api } from '@/api';

type User = {
	id: string;
	username: string;
	walletAddress?: string | null;
};

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

export default function CommunitysPage() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const router = useRouter();

	// 커뮤니티 상태 관리
	const [communitys, setCommunitys] = useState<Community[]>([]);
	const [filteredCommunitys, setFilteredCommunitys] = useState<Community[]>([]);
	const [communityLoading, setCommunityLoading] = useState(true);
	const [communityError, setCommunityError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUser() {
			try {
				const { data } = await api.get<User>('/auth/user');
				setUser(data);
			} catch (error) {
				console.error('Error fetching user:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, []);

	// 커뮤니티 데이터 불러오기
	useEffect(() => {
		async function fetchCommunities() {
			try {
				const { data } = await api.get<Community[]>('/communities');
				setCommunitys(data);
				setFilteredCommunitys(data);
			} catch (error) {
				console.error('Error fetching communities:', error);
				setCommunityError(error instanceof Error ? error.message : 'Failed to load communities');
			} finally {
				setCommunityLoading(false);
			}
		}

		fetchCommunities();
	}, []);

	const handleWalletLinked = (walletAddress: string) => {
		if (user) {
			setUser({
				...user,
				walletAddress,
			});
		}
	};

	// 검색 기능 처리
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
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8">
				<Toaster position="top-right" />
				<div className="flex justify-between items-center mb-8">
					<div className="flex items-center gap-4">
						<h1 className="text-3xl font-bold uppercase tracking-wider">Communities</h1>
						{user && (
							<button
								onClick={() => setIsCreateDialogOpen(true)}
								className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 border-2 border-black dark:border-white text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
							>
								<span>+</span>
								<span>Create Community</span>
							</button>
						)}
					</div>
					<div className="flex items-center gap-4">
						{/* {user ? (
							<>
								<p className="text-sm">
									Logged in as <span className="font-semibold">@{user.username}</span>
								</p>
								<Link
									href="/auth/logout"
									className="bg-gray-200 dark:bg-gray-700 px-4 py-2 border-2 border-black dark:border-white text-sm font-bold"
								>
									Logout
								</Link>
							</>
						) : (
							<Link
								href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login/twitter`}
								className="bg-black text-white px-4 py-2 border-2 border-black text-sm font-bold"
							>
								Login with X
							</Link>
						)} */}
						{/* <div className="ml-2">
							<WalletButton />
						</div> */}
						{user && (
							<div className="ml-2">
								<LinkWalletButton user={user} onWalletLinked={handleWalletLinked} />
							</div>
						)}
					</div>
				</div>

				<div className="flex-1">
					{/* 커뮤니티 목록 직접 표시 */}
					<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-8">
						<h2 className="text-2xl font-bold tracking-widest uppercase mb-4">Active Communities</h2>
						<hr className="border-black dark:border-white border-1 mb-6" />

						<SearchCommunities onSearch={handleSearch} />

						{communityLoading ? (
							<div className="flex justify-center items-center h-40">
								<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
							</div>
						) : communityError ? (
							<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300">
								{communityError}
							</div>
						) : filteredCommunitys.length === 0 ? (
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
				</div>

				<CreateCommunityDialog
					isOpen={isCreateDialogOpen}
					onClose={() => setIsCreateDialogOpen(false)}
					userWalletAddress={user?.walletAddress}
				/>
			</div>
		</div>
	);
}
