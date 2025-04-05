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
import { useWebSocket } from '@/hooks/useWebSocket';

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
	const [secondsCounter, setSecondsCounter] = useState<number>(0);
	const [remainingTimeText, setRemainingTimeText] = useState<string>('');

	// Connect to WebSocket for real-time updates
	const { isConnected, lastMessageTime } = useWebSocket(id as string);

	// Update community data when a new message is received
	useEffect(() => {
		if (lastMessageTime && community) {
			setCommunity({
				...community,
				lastMessageTime,
			});
		}
	}, [lastMessageTime, community]);

	// Update timer every second for real-time countdown
	useEffect(() => {
		const timer = setInterval(() => {
			setSecondsCounter(prev => prev + 1);
			updateRemainingTime();
		}, 1000);
		
		return () => clearInterval(timer);
	}, [community?.lastMessageTime, community?.timeLimit]);

	// Calculate and update the remaining time text
	const updateRemainingTime = () => {
		if (!community?.timeLimit || !community?.lastMessageTime) {
			setRemainingTimeText(community?.timeLimit ? `${community.timeLimit}m (inactive)` : '-');
			return;
		}
		
		const lastMessageDate = new Date(community.lastMessageTime);
		const now = new Date();
		const elapsedMsSinceLastMessage = now.getTime() - lastMessageDate.getTime();
		
		// Convert time limit from minutes to milliseconds
		const timeLimitMs = community.timeLimit * 60 * 1000;
		
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

	// Initialize remaining time when community data changes
	useEffect(() => {
		if (community) {
			updateRemainingTime();
		}
	}, [community]);

	useEffect(() => {
		async function fetchData() {
			try {
				const [communityResponse, userResponse] = await Promise.all([
					api.get<Community>(`/communities/${id}/messages`),
					api.get<User>('/auth/user'),
				]);

				console.log('Community data loaded:', communityResponse.data);
				console.log('User data loaded:', userResponse.data);
				console.log('WebSocket connected:', isConnected);

				if (communityResponse.data.messages && communityResponse.data.messages.length > 0) {
					console.log('Message structure sample:', communityResponse.data.messages[0]);
				}

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
	}, [id, isConnected]);

	const isExpired = () => {
		if (!community?.timeLimit || !community?.lastMessageTime) return false;
		
		const lastMessageDate = new Date(community.lastMessageTime);
		const now = new Date();
		const elapsedMsSinceLastMessage = now.getTime() - lastMessageDate.getTime();
		const timeLimitMs = community.timeLimit * 60 * 1000;
		
		return elapsedMsSinceLastMessage >= timeLimitMs;
	};

	const handleRefresh = async () => {
		try {
			const { data } = await api.get<Community>(`/communities/${id}/messages`);
			setCommunity(data);
			// Debug message structure
			if (data.messages && data.messages.length > 0) {
				console.log('Message structure sample:', data.messages[0]);
			}
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

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<Link
						href="/communities"
						className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
					>
						← back to community list
					</Link>
				</div>

				<div className="flex gap-8">
					{/* 왼쪽 사이드바 */}
					<div className="w-64 bg-white dark:bg-gray-800 border-2 border-[rgba(255,182,193,0.5)] p-4 shadow-[0_4px_0_rgba(255,182,193,0.5)] rounded-[20px]">
						<div className="mb-6">
							<h2 className="text-xl font-bold mb-4">staker list</h2>
							<div className="space-y-2">{/* 여기에 커뮤니티 목록이 들어갈 예정 */}</div>
						</div>
					</div>

					{/* 메인 컨텐츠 */}
					<div className="flex-1">
						<Toaster position="top-right" />

						<div className="bg-white dark:bg-gray-800 border-2 border-[rgba(255,182,193,0.5)] p-6 mb-8 shadow-[0_4px_0_rgba(255,182,193,0.5)] rounded-[20px]">
							<div className="flex justify-between items-start mb-6">
								<div>
									<h1 className="text-3xl font-bold mb-2">{community.name}</h1>
									<p className="text-gray-600 dark:text-gray-300">{community.description}</p>
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
										Created by @{community.creator.username}
									</p>
								</div>
								<div className="flex items-center space-x-4">
									{/* <WalletButton /> */}
									{!expired && (
										<button
											onClick={() => setIsDepositDialogOpen(true)}
											className="bg-[rgba(255,182,193,0.5)] hover:bg-[rgba(255,182,193,0.6)] text-black px-4 py-2 border-2 border-[rgba(255,182,193,0.5)] font-bold transition-colors rounded-[20px]"
										>
											bounty deposit
										</button>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<div className="relative overflow-hidden rounded-[20px] border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white shadow-[0_4px_0_rgba(255,182,193,0.5)]">
									<div className="relative">
										<div className="text-sm font-bold mb-1">total bounty</div>
										<div className="text-2xl font-mono font-bold">{community.bountyAmount} SOL</div>
									</div>
								</div>
								<div
									className={`relative overflow-hidden rounded-[20px] border-2 border-[rgba(255,182,193,0.5)] p-4 shadow-[0_4px_0_rgba(255,182,193,0.5)] ${
										expired
											? 'bg-red-100'
											: !community.lastMessageTime
											? 'bg-gray-100'
											: remainingTimeText.includes('m') && parseInt(remainingTimeText.split('m')[0]) <= 5
											? 'bg-orange-100'
											: 'bg-green-100'
									}`}
								>
									<div className="relative">
										<div className="text-sm font-bold mb-1">time remaining</div>
										<div className="text-2xl font-mono font-bold">
											{remainingTimeText}
											{/* This hidden span forces re-render every second */}
											<span className="hidden">{secondsCounter}</span>
										</div>
									</div>
								</div>
								<div className="relative overflow-hidden rounded-[20px] border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white shadow-[0_4px_0_rgba(255,182,193,0.5)]">
									<div className="relative">
										<div className="text-sm font-bold mb-1">base fee</div>
										<div className="text-2xl font-mono font-bold">{community.baseFeePercentage}%</div>
									</div>
								</div>
							</div>

							<div className="text-sm text-gray-500 dark:text-gray-400">
								{community.contractAddress && (
									<div>
										컨트랙트 주소: <span className="font-mono">{community.contractAddress}</span>
									</div>
								)}
								<div>Created at: {new Date(community.createdAt).toLocaleString()}</div>
								<div className="flex items-center">
									Latest activity:
									<span className="font-medium ml-1">
										{community.lastMessageTime
											? new Date(community.lastMessageTime).toLocaleString()
											: 'No messages yet'}
									</span>
									{isConnected && (
										<span className="flex h-2 w-2 ml-2">
											<span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 border-2 border-[rgba(255,182,193,0.5)] p-6 shadow-[0_4px_0_rgba(255,182,193,0.5)] rounded-[20px]">
							<h2 className="text-2xl font-bold mb-6">messages</h2>
							{expired ? (
								<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 mb-6">
									This community has expired
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
				</div>
			</div>
		</div>
	);
}
