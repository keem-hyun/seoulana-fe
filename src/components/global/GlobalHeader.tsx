'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useSearchParams, useRouter } from 'next/navigation';

export default function GlobalHeader() {
	const { publicKey } = useWallet();
	const [mounted, setMounted] = useState(false);
	const [hasTwitterConnected, setHasTwitterConnected] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();

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
		<header className="sticky top-0 w-full h-16 py-6 px-6 flex justify-between items-center relative z-50 bg-gradient-to-br from-pink-light/40 via-white to-purple-light/40 backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<Link href="/" className="flex items-center gap-3">
					<div className="w-12 h-12 bg-white rounded-xl shadow-pink flex items-center justify-center p-2">
						<Image src="/images/kasoro_logo.png" alt="Kasoro Logo" width={32} height={32} />
					</div>
					<h2 className="font-[bazzi] text-xl font-bold text-pink-primary">KASORO</h2>
				</Link>
				<nav className="flex items-center gap-6 ml-6">
					<a href="#features" className="text-purple-dark font-medium hover:text-pink-primary transition-colors">
						Features
					</a>
					<a href="#how-it-works" className="text-purple-dark font-medium hover:text-pink-primary transition-colors">
						How It Works
					</a>
				</nav>
			</div>
			
			<div className="flex items-center gap-4">
				{mounted && <WalletButton />}
			</div>
		</header>
	);
}