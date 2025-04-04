'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/api';
import MessageList from '@/components/MessageList';
import CreateMessageForm from '@/components/CreateMessageForm';
import { WalletButton } from '@/components/wallet/WalletButton';
import { toast, Toaster } from 'react-hot-toast';
import DepositBountyDialog from '@/components/communities/DepositBountyDialog';
interface Creator {
	id: string;
	xId: string;
	username: string;
	displayName: string;
	profileImageUrl: string | null;
}

interface Community {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	creatorId: string;
	creator: Creator;
	messages: any[];
	lastMessageTime: string;
	contractAddress: string;
	bountyAmount: number;
	timeLimit: number;
	baseFeePercentage: number;
	walletAddress: string | null;
}

interface User {
	id: string;
	username: string;
	walletAddress?: string | null;
}

export default function CommunityPage() {
	const { id } = useParams();
	const [community, setCommunity] = useState<Community | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

	useEffect(() => {
		async function fetchData() {
			try {
				const [communityResponse, userResponse] = await Promise.all([
					api.get<Community>(`/communities/${id}`),
					api.get<User>('/auth/user'),
				]);

				setCommunity(communityResponse.data);
				setUser(userResponse.data);
			} catch (error) {
				console.error('Error fetching data:', error);
				setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다');
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [id]);

	const getRemainingTime = () => {
		if (!community?.timeLimit || !community?.createdAt) return null;

		const createdTime = new Date(community.createdAt).getTime();
		const currentTime = new Date().getTime();
		const timeLimitMs = community.timeLimit * 60 * 1000;
		const remainingMs = createdTime + timeLimitMs - currentTime;

		if (remainingMs <= 0) return '종료됨';

		const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
		const remainingHours = Math.floor(remainingMinutes / 60);

		if (remainingHours > 0) {
			return `${remainingHours}시간 ${remainingMinutes % 60}분 남음`;
		}
		return `${remainingMinutes}분 남음`;
	};

	const isExpired = () => {
		if (!community?.timeLimit || !community?.createdAt) return false;
		const createdTime = new Date(community.createdAt).getTime();
		const currentTime = new Date().getTime();
		const timeLimitMs = community.timeLimit * 60 * 1000;
		return currentTime - createdTime > timeLimitMs;
	};

	const handleRefresh = async () => {
		try {
			const { data } = await api.get<Community>(`/communities/${id}`);
			setCommunity(data);
		} catch (error) {
			console.error('Error refreshing community:', error);
			toast.error('커뮤니티 정보를 새로고침하는데 실패했습니다');
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
				<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300">
					{error || '커뮤니티를 찾을 수 없습니다'}
				</div>
			</div>
		);
	}

	const expired = isExpired();
	const remainingTime = getRemainingTime();

	return (
		<div className="container mx-auto px-4 py-8">
			<Toaster position="top-right" />

			<div className="mb-8">
				<Link
					href="/communities"
					className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
				>
					← 커뮤니티 목록으로 돌아가기
				</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-6 mb-8">
				<div className="flex justify-between items-start mb-6">
					<div>
						<h1 className="text-3xl font-bold mb-2">{community.name}</h1>
						<p className="text-gray-600 dark:text-gray-300">{community.description}</p>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Created by @{community.creator.username}</p>
					</div>
					<div className="flex items-center space-x-4">
						<WalletButton />
						{!expired && (
							<button
								onClick={() => setIsDepositDialogOpen(true)}
								className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 border-2 border-black font-bold transition-colors"
							>
								바운티 입금
							</button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="border-2 border-black p-4 bg-yellow-300">
						<div className="text-sm font-bold mb-1">현재 바운티</div>
						<div className="text-2xl font-mono font-bold">{community.bountyAmount} SOL</div>
					</div>
					<div
						className={`border-2 border-black p-4 ${
							expired
								? 'bg-red-300'
								: remainingTime?.includes('분') && !remainingTime?.includes('시간')
								? 'bg-orange-300'
								: 'bg-green-300'
						}`}
					>
						<div className="text-sm font-bold mb-1">남은 시간</div>
						<div className="text-2xl font-mono font-bold">{remainingTime}</div>
					</div>
					<div className="border-2 border-black p-4 bg-blue-300">
						<div className="text-sm font-bold mb-1">기본 수수료</div>
						<div className="text-2xl font-mono font-bold">{community.baseFeePercentage}%</div>
					</div>
				</div>

				<div className="text-sm text-gray-500 dark:text-gray-400">
					{community.contractAddress && (
						<div>
							컨트랙트 주소: <span className="font-mono">{community.contractAddress}</span>
						</div>
					)}
					<div>생성 시간: {new Date(community.createdAt).toLocaleString()}</div>
					<div>마지막 메시지: {new Date(community.lastMessageTime).toLocaleString()}</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-6">
				<h2 className="text-2xl font-bold mb-6">메시지</h2>
				{expired ? (
					<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 mb-6">
						이 커뮤니티는 종료되었습니다
					</div>
				) : (
					<>
						<div className="mb-6">
							<CreateMessageForm communityId={community.id} onMessageSent={handleRefresh} />
						</div>
					</>
				)}
				<MessageList messages={community.messages} currentUserId={user?.id} />
			</div>

			<DepositBountyDialog
				isOpen={isDepositDialogOpen}
				onClose={() => setIsDepositDialogOpen(false)}
				communityId={community.id}
				contractAddress={community.contractAddress}
				onBountyDeposited={handleRefresh}
			/>
		</div>
	);
}
