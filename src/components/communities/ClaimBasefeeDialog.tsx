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
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface ClaimBasefeeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	communityId: string;
	contractAddress: string;
	// onBountyDeposited: () => void;
}
const PROGRAM_ID = new PublicKey('CEnBjSSjuoL13LtgDeALeAMWqSg9W7t1J5rtjeKNarAM');

export default function ClaimBasefeeDialog({
	isOpen,
	onClose,
	communityId,
	contractAddress,
	// onBountyDeposited,
}: ClaimBasefeeDialogProps) {
	const [amount, setAmount] = useState(1);
	const [loading, setLoading] = useState(false);
	const [communityName, setCommunityName] = useState<string | null>(null);
	const [initializerAddress, setInitializerAddress] = useState<string | null>(null);
	const [vaultBalance, setVaultBalance] = useState<number>(0);
	const [claimableBalance, setClaimableBalance] = useState<number>(0);
	const [claimPercentage, setClaimPercentage] = useState<number>(0);
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
					walletAddress: string;
				}
				
				const { data } = await api.get<CommunityResponse>(`/communities/${communityId}`);
				setCommunityName(data.name);
				setInitializerAddress(data.walletAddress);
				console.log('Initializer address loaded:', data.walletAddress);
				console.log('Community name loaded:', data.name);
			
				if (data.walletAddress && data.name) {
					const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
					const initializerPubkey = new PublicKey(data.walletAddress);
					
					const [communityPda] = anchor.web3.PublicKey.findProgramAddressSync(
						[
							Buffer.from("community"),
							initializerPubkey.toBuffer(),
							Buffer.from(data.name)
						],
						PROGRAM_ID
					);
					
					const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
						[
							Buffer.from("vault"),
							initializerPubkey.toBuffer(),
							Buffer.from(data.name)
						],
						PROGRAM_ID
					);
					
					const vaultBalanceRaw = await connection.getBalance(vaultPda);
					const vaultBalanceSol = vaultBalanceRaw / LAMPORTS_PER_SOL;
					setVaultBalance(vaultBalanceSol);
					
					if (publicKey) {
						try {
							const provider = new AnchorProvider(
								connection,
								{
									publicKey,
									signTransaction: async (tx: web3.Transaction) => tx,
								},
								{ preflightCommitment: 'processed' }
							);
							
							const program = new Program(kasoroIdl as Kasoro, provider);
							
							// Fetch the vault account data to get depositor information
							const vaultAccount = await program.account.basefeeVault.fetch(vaultPda);
							
							let totalDeposit = 0;
							let userDeposit = 0;
							
							// Calculate total deposits and find the user's deposit
							if (vaultAccount.depositInfo && Array.isArray(vaultAccount.depositInfo)) {
								for (const deposit of vaultAccount.depositInfo) {
									const depositAmount = deposit.bountyAmount ? Number(deposit.bountyAmount) : 0;
									totalDeposit += depositAmount;
									
									// Check if this deposit belongs to the current user
									if (deposit.depositAddress && deposit.depositAddress.toString() === publicKey.toString()) {
										userDeposit = depositAmount;
									}
								}
							}
							
							let claimableAmount = 0;
							if (totalDeposit > 0) {
								claimableAmount = (vaultBalanceRaw * userDeposit) / totalDeposit;
							}
							
							const claimableBalanceSol = claimableAmount / LAMPORTS_PER_SOL;
							setClaimableBalance(claimableBalanceSol);
							
							const percentage = totalDeposit > 0 ? (userDeposit / totalDeposit) * 100 : 0;
							setClaimPercentage(percentage);
							
							//console.log('User deposit:', userDeposit);
							//console.log('Total deposit:', totalDeposit);
							//console.log('Claimable amount:', claimableAmount);
							//console.log('Claimable percentage:', percentage);
						} catch (error) {
							console.error('Error calculating claimable amount:', error);
						}
					}
				}
			} catch (err) {
				console.error('Error fetching community data:', err);
				toast.error('커뮤니티 데이터를 불러오는데 실패했습니다');
			}
		};
		
		if (communityId) {
			fetchCommunityName();
		}
	}, [communityId, publicKey]);
	
	const handleClaim = async () => {
		if (!connected || !publicKey) {
			toast.error('지갑을 연결해주세요');
			return;
		}
		
		if (!communityName) {
			toast.error('커뮤니티 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요');
			return;
		}

		if (!initializerAddress) {
			toast.error('커뮤니티 222정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요');
			return;
		}

		const initializerPubkey = new PublicKey(initializerAddress);

		setLoading(true);

		try {
			const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
			console.log("Connection structure:", connection);
			
			// PDA 주소 계산
			const [communityPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[
					Buffer.from("community"),
					initializerPubkey.toBuffer(),
					Buffer.from(communityName)
				],
				PROGRAM_ID
			);
			console.log("Community PDA:", communityPda.toString());
			
			const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[
					Buffer.from("vault"),
					initializerPubkey.toBuffer(),
					Buffer.from(communityName)
				],
				PROGRAM_ID
			);
			console.log("Vault PDA:", vaultPda.toString());
			
			const provider = new AnchorProvider(
				connection,
				{
					publicKey,
					signTransaction: async (tx: web3.Transaction) => {
						tx.feePayer = publicKey;
						tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
						return await sendTransaction(tx, connection);
					},
				},
				{ preflightCommitment: 'processed' }
			);

			const program = new Program(kasoroIdl as Kasoro, provider);
			console.log('Program structure:', program.programId.toString());
			// Create a transaction to initialize community
			const transaction = new web3.Transaction();
			console.log('Transaction structure:', transaction);
			const beforeBalance = await connection.getBalance(publicKey);
			console.log('beforeBalance:', beforeBalance);
			const beforeVaultBalance = await connection.getBalance(vaultPda);
			console.log('beforeVaultBalance:', beforeVaultBalance);
			transaction.add(
				await program.methods
					.claim(
						
					)
					.accounts({
						depositor: publicKey,
						community: communityPda,
						vault: vaultPda,
						systemProgram: web3.SystemProgram.programId,
					})
					.instruction()
			);

			// Send transaction to the network
			const signature = await sendTransaction(transaction, connection);

			// Wait for confirmation
			const latestBlockhash = await connection.getLatestBlockhash();
			await connection.confirmTransaction({
				signature,
				blockhash: latestBlockhash.blockhash,
				lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
			}, 'confirmed');
			
			const afterBalance = await connection.getBalance(publicKey);
			console.log('afterBalance:', afterBalance);

			const afterVaultBalance = await connection.getBalance(vaultPda);
			console.log('afterVaultBalance:', afterVaultBalance);

			toast.success('base fee 클레임 성공!');
			// onBountyDeposited();
			onClose();
		} catch (error) {
			console.error('Error claiming bounty:', error);
			toast.error(error instanceof Error ? error.message : '클레임에 실패했습니다');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">Claim</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="p-4 border rounded bg-gray-50">
						<div className="grid grid-cols-2 gap-2">
							<div className="text-sm font-medium text-gray-700">Vault Balance:</div>
							<div className="text-sm font-semibold text-right">{vaultBalance.toFixed(4)} SOL</div>
							
							<div className="text-sm font-medium text-gray-700">Claimable Balance:</div>
							<div className="text-sm font-semibold text-right">{claimableBalance.toFixed(4)} SOL</div>
							
							<div className="text-sm font-medium text-gray-700">Percentage:</div>
							<div className="text-sm font-semibold text-right">{claimPercentage.toFixed(2)}%</div>
						</div>
					</div>

					<button
						onClick={handleClaim}
						disabled={loading || !connected || claimableBalance <= 0}
						className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
					>
						{loading ? 'claiming...' : 'Claim'}
					</button>

					{!connected && (
						<p className="text-sm text-center text-yellow-600 dark:text-yellow-400">
							출금하려면 지갑을 연결해주세요
						</p>
					)}
					
					{connected && claimableBalance <= 0 && (
						<p className="text-sm text-center text-yellow-600 dark:text-yellow-400">
							현재 클레임 가능한 금액이 없습니다
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
