'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { api } from '@/api';
import { Kasoro } from '../../../../contract/target/types/kasoro';
import kasoroIdl from '../../../../contract/target/idl/kasoro.json';

import { useRouter } from 'next/navigation';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface DepositBountyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	communityId: string;
	contractAddress: string;
	onBountyDeposited: () => void;
}
const PROGRAM_ID = new PublicKey('38cVbT7EHqPwfXR1VgXA5jJiBe3DSAFr6cdCEPx4fbAv');

export default function DepositBountyDialog({
	isOpen,
	onClose,
	communityId,
	contractAddress,
	onBountyDeposited,
}: DepositBountyDialogProps) {
	const [amount, setAmount] = useState(1);
	const [loading, setLoading] = useState(false);
	const [communityName, setCommunityName] = useState<string | null>(null);
	const { connected, publicKey, sendTransaction } = useWallet();
	
	// 커뮤니티 이름 가져오기
	useEffect(() => {
		const fetchCommunityName = async () => {
			try {
				interface CommunityResponse {
					id: string;
					name: string;
					description: string;
					createdAt: string;
					creatorId: string;
				}
				
				const { data } = await api.get<CommunityResponse>(`/communities/${communityId}`);
				setCommunityName(data.name);
				console.log('Community name loaded:', data.name);
			} catch (err) {
				console.error('Error fetching community data:', err);
				toast.error('커뮤니티 데이터를 불러오는데 실패했습니다');
			}
		};
		
		if (communityId) {
			fetchCommunityName();
		}
	}, [communityId]);
	
	const handleDeposit = async () => {
		if (!connected || !publicKey) {
			toast.error('지갑을 연결해주세요');
			return;
		}
		
		if (!communityName) {
			toast.error('커뮤니티 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요');
			return;
		}

		setLoading(true);

		try {
			const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
			console.log("Connection structure:", connection);
			
			// PDA 주소 계산
			const [communityPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[
					Buffer.from("community"),
					publicKey.toBuffer(),
					Buffer.from(communityName)
				],
				PROGRAM_ID
			);
			console.log("Community PDA:", communityPda.toString());
			
			const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[
					Buffer.from("vault"),
					publicKey.toBuffer(),
					Buffer.from(communityName)
				],
				PROGRAM_ID
			);
			console.log("Vault PDA:", vaultPda.toString());
			
			// SOL을 lamports로 변환 (1 SOL = 10^9 lamports)
			const lamports = amount * 1_000_000_000;
			
			// 트랜잭션 생성
			const transaction = new web3.Transaction();
			
			// 트랜잭션에 송금 명령 추가
			transaction.add(
				web3.SystemProgram.transfer({
					fromPubkey: publicKey,
					toPubkey: vaultPda,
					lamports,
				})
			);
			
			// 트랜잭션 전송
			const signature = await sendTransaction(transaction, connection);
			console.log("Transaction signature:", signature);
			
			// 트랜잭션 확인 대기
			const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');
			console.log("Transaction confirmed");
			
			// 백엔드 API 호출하여 바운티 정보 업데이트
			await api.post(`/communities/${communityId}/deposit`, {
				amount,
				walletAddress: publicKey.toString(),
			});

			// Call the onBountyDeposited callback to refresh the parent component
			if (onBountyDeposited) {
				await onBountyDeposited();
			}
			
			// Success message
			toast.success('Deposit successful!');
			
			// Close the dialog
			onClose();
			
			// Force a full page refresh to update all components
			window.location.reload();
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
					<DialogTitle className="text-xl font-bold">Bounty Deposit</DialogTitle>
				</DialogHeader>

				<div className="mt-4">
					<div className="mb-4">
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
							contract address: <span className="font-mono">{contractAddress}</span>
						</p>
					</div>

					<div className="mb-6">
						<label className="block font-bold text-sm uppercase tracking-widest mb-2">amount to deposit (SOL)</label>
						<div className="border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white dark:bg-gray-800 flex items-center rounded-[20px]">
							<input
								type="range"
								min="0.1"
								max="10"
								step="0.1"
								value={amount}
								onChange={(e) => setAmount(parseFloat(e.target.value))}
								className="w-full mr-4 accent-[rgba(255,182,193,0.5)]"
							/>
							<div className="min-w-[80px] bg-white py-1 px-3 font-mono font-bold text-center border-2 border-[rgba(255,182,193,0.5)] rounded-[20px]">
								{amount} SOL
							</div>
						</div>
					</div>

					<button
						onClick={handleDeposit}
						disabled={loading || !connected}
						className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
					>
						{loading ? 'depositing...' : 'deposit'}
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
