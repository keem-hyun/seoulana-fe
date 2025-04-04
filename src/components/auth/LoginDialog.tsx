import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface LoginDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
	const { publicKey } = useWallet();
	const [mounted, setMounted] = useState(false);

	// Ensure component is mounted before rendering wallet button to avoid hydration errors
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-center text-2xl font-bold text-purple-dark">Login</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{mounted && (
						<div className="flex flex-col items-center gap-2">
							<WalletMultiButton className="wallet-button w-full px-4 py-3 rounded-lg bg-gradient-to-r from-pink-primary to-purple-primary text-purple-dark font-medium hover:opacity-90 transition-opacity border border-purple-primary" />
						</div>
					)}

					<Link
						href={`${process.env.NEXT_PUBLIC_API_URL}/auth/login/twitter`}
						className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-black text-white font-medium hover:opacity-90 transition-opacity"
					>
						Connect X
					</Link>

					<button
						className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-purple-primary text-purple-primary font-medium hover:bg-purple-primary hover:text-purple-dark transition-colors"
						onClick={() => {}}
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
				</div>
			</DialogContent>
		</Dialog>
	);
}
