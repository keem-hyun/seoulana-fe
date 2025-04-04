import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { api } from '@/api';

interface DepositBountyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	communityId: string;
	contractAddress: string;
	onBountyDeposited: () => void;
}

export default function DepositBountyDialog({
	isOpen,
	onClose,
	communityId,
	contractAddress,
	onBountyDeposited,
}: DepositBountyDialogProps) {
	const [amount, setAmount] = useState(1);
	const [loading, setLoading] = useState(false);
	const { connected, publicKey } = useWallet();

	const handleDeposit = async () => {
		if (!connected || !publicKey) {
			toast.error('지갑을 연결해주세요');
			return;
		}

		setLoading(true);

		try {
			await api.post(`/communities/${communityId}/deposit`, {
				amount,
				walletAddress: publicKey.toString(),
			});

			toast.success('바운티가 성공적으로 입금되었습니다!');
			onBountyDeposited();
			onClose();
		} catch (error) {
			console.error('Error depositing bounty:', error);
			toast.error(error instanceof Error ? error.message : '바운티 입금에 실패했습니다');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">바운티 입금</DialogTitle>
				</DialogHeader>

				<div className="mt-4">
					<div className="mb-4">
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
							컨트랙트 주소: <span className="font-mono">{contractAddress}</span>
						</p>
					</div>

					<div className="mb-6">
						<label className="block font-bold text-sm uppercase tracking-widest mb-2">입금할 금액 (SOL)</label>
						<div className="border-2 border-black dark:border-white p-4 bg-blue-100 dark:bg-gray-800 flex items-center">
							<input
								type="range"
								min="0.1"
								max="10"
								step="0.1"
								value={amount}
								onChange={(e) => setAmount(parseFloat(e.target.value))}
								className="w-full mr-4 accent-blue-500"
							/>
							<div className="min-w-[80px] bg-yellow-300 py-1 px-3 font-mono font-bold text-center border-2 border-black">
								{amount} SOL
							</div>
						</div>
					</div>

					<button
						onClick={handleDeposit}
						disabled={loading || !connected}
						className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
					>
						{loading ? '입금 중...' : '입금하기'}
					</button>

					{!connected && (
						<p className="mt-4 text-sm text-center text-yellow-600 dark:text-yellow-400">
							입금하려면 지갑을 연결해주세요
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
