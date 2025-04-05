'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
	const { publicKey } = useWallet();
	const [mounted, setMounted] = useState(false);
	const [hasTwitterConnected, setHasTwitterConnected] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();

	// Ensure component is mounted before rendering wallet button to avoid hydration errors
	useEffect(() => {
		setMounted(true);

		// URL 파라미터로부터 트위터 연결 상태 확인
		const twitterConnected = searchParams.get('twitter') === 'connected';
		if (twitterConnected) {
			setHasTwitterConnected(true);
		}
	}, [searchParams]);

	const isLoginEnabled = publicKey && hasTwitterConnected;

	const handleLogin = () => {
		// 로그인 처리 로직
		if (isLoginEnabled) {
			console.log('로그인 처리:', {
				wallet: publicKey?.toString(),
				twitter: 'connected',
			});
			// 로그인 성공 후 홈페이지로 리다이렉트
			router.push('/');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-light/20 via-white to-purple-light/20">
			<div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
				<div className="flex flex-col items-center mb-6">
					<div className="w-16 h-16 bg-white rounded-xl shadow-pink flex items-center justify-center p-2 mb-4">
						<Image src="/images/kasoro_logo.png" alt="Kasoro Logo" width={40} height={40} />
					</div>
					<h1 className="text-2xl font-bold text-purple-dark mb-2">Login</h1>
					<p className="text-sm text-gray-500 text-center">
						To continue, please connect your wallet and X (Twitter) account.
					</p>
				</div>

				{searchParams.get('error') && (
					<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
						{searchParams.get('error') === 'twitter_auth_failed'
							? 'Failed to connect X account. Please try again.'
							: 'An error occurred. Please try again.'}
					</div>
				)}

				<div className="grid gap-4 py-4">
					{mounted && (
						<div className="flex flex-col items-center gap-2">
							<WalletButton />
							<div className="mt-2 text-center text-sm text-gray-500">
								{publicKey ? '✅ Wallet connected' : 'Connect your wallet'}
							</div>
						</div>
					)}

					<Link
						href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login/twitter`}
						className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-black text-white font-medium hover:opacity-90 transition-opacity"
					>
						{hasTwitterConnected ? '✅ X account connected' : 'Connect X account'}
					</Link>

					<button
						className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
							isLoginEnabled
								? 'bg-gradient-to-r from-pink-primary to-purple-primary text-purple-dark hover:shadow-pink'
								: 'border border-purple-primary text-purple-primary hover:bg-purple-primary hover:text-purple-dark cursor-not-allowed opacity-50'
						}`}
						onClick={handleLogin}
						disabled={!isLoginEnabled}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						Login
					</button>

					<div className="text-center">
						<Link href="/" className="text-sm text-purple-primary hover:underline">
							Back to Home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
