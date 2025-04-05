'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { api } from '@/api';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Import from contract target types
import { Kasoro } from '../../../../contract/target/types/kasoro';
import kasoroIdl from '../../../../contract/target/idl/kasoro.json';

// Placeholder for program ID - replace with actual ID from lib.rs
const PROGRAM_ID = new PublicKey('38cVbT7EHqPwfXR1VgXA5jJiBe3DSAFr6cdCEPx4fbAv');

interface CreateCommunityDialogProps {
	isOpen: boolean;
	onClose: () => void;
	userWalletAddress?: string | null;
}

interface CommunityResponse {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	creatorId: string;
}

export default function CreateCommunityDialog({ isOpen, onClose, userWalletAddress }: CreateCommunityDialogProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [bountyAmount, setBountyAmount] = useState(1);
	const [timeLimit, setTimeLimit] = useState(30);
	const [baseFee, setBaseFee] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { connected, publicKey, sendTransaction } = useWallet();

	const isWalletLinked = !!userWalletAddress;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!connected || !publicKey) {
			setError('Please connect your wallet first');
			toast.error('Please connect your wallet first');
			return;
		}

		if (!isWalletLinked) {
			setError('Please link your wallet to your account first');
			toast.error('Please link your wallet to your account first');
			return;
		}

		// Check that connected wallet matches linked wallet
		if (publicKey.toString() !== userWalletAddress) {
			setError("The connected wallet doesn't match your linked wallet");
			toast.error("The connected wallet doesn't match your linked wallet");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Create connection to the cluster
			const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
			console.log('Connection structure:', connection);
			// Create a provider from connection and wallet
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
			// Load program from IDL
			console.log('IDL structure:', kasoroIdl);
			console.log('Provider structure:', provider);
			console.log('publickey:', publicKey.toString());
			console.log('programId:', PROGRAM_ID.toString());
			console.log('provider:', provider.publicKey.toString());

			const program = new Program(kasoroIdl as Kasoro, provider);
			console.log('Program structure:', program.programId.toString());
			// Create a transaction to initialize community
			const transaction = new web3.Transaction();
			console.log('Transaction structure:', transaction);
			// Find PDA for community and vault
			const [communityPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[Buffer.from('community'), publicKey.toBuffer(), Buffer.from(name)],
				PROGRAM_ID
			);
			console.log('Community PDA structure:', communityPda);
			const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
				[Buffer.from('vault'), publicKey.toBuffer(), Buffer.from(name)],
				PROGRAM_ID
			);
			console.log('Vault PDA structure:', vaultPda);
			// Add initialize instruction to transaction
			transaction.add(
				await program.methods
					.initialize(
						name,
						new anchor.BN(timeLimit), // Convert minutes to seconds
						new anchor.BN(100000), // Base fee percentage
						2, // fee_multiplier (example value)
						new PublicKey('5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'), // lst_addr (using user's public key as placeholder)
						false // ai_moderation
					)
					.accounts({
						initializer: publicKey,
						community: communityPda,
						vault: vaultPda,
						systemProgram: web3.SystemProgram.programId,
					})
					.instruction()
			);

			// Send transaction to the network
			const signature = await sendTransaction(transaction, connection);

			// Wait for confirmation
			await connection.confirmTransaction(signature, 'confirmed');

			const communityAccount = await program.account.communityState.fetch(communityPda);
			console.log('CommunityState account pubkey:', communityPda.toString());
			console.log('vault account pubkey:', vaultPda.toString());
			console.log('CommunityState account:', communityAccount);

			console.log('CommunityState name:', communityAccount.communityName);
			console.log('CommunityState timeLimit:', communityAccount.timeLimit);
			console.log('CommunityState baseFeePercentage:', communityAccount.initBaseFee);
			//  console.log("CommunityState fee_multiplier:", communityAccount.fee_multiplier);
			console.log('CommunityState prize_ratio:', communityAccount.prizeRatio);
			console.log('CommunityState active:', communityAccount.active);
			console.log('CommunityState lstAddr:', communityAccount.lstAddr.toString());
			console.log('CommunityState basefee_vault:', communityAccount.basefeeVault.toString());
			//  console.log("CommunityState aiModeration:", communityAccount.ai_moderation);

			// Call the backend API to register the community in the database
			const { data } = await api.post<CommunityResponse>('/communities', {
				name,
				description,
				bountyAmount,
				timeLimit,
				baseFee,
				walletAddress: publicKey.toString(),
			});

			// Reset form
			setName('');
			setDescription('');
			setBountyAmount(1);
			setTimeLimit(30);
			setBaseFee(0.0001);

			toast.success('Community created successfully!');
			onClose();

			// Navigate to the new community
			router.push(`/communities/${data.id}`);
		} catch (error) {
			console.error('Error creating community:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create community';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-[20px] overflow-hidden shadow-[0_4px_0_rgba(255,182,193,0.5)] group transition-all duration-300 flex flex-col border-2 border-[rgba(255,182,193,0.5)] p-6 w-full max-w-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Create New Community</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-3 text-red-800 dark:text-red-300 text-sm rounded-lg">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="name" className="block font-bold text-sm uppercase tracking-widest mb-1">
							Name
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full px-3 py-2 border-2 border-[rgba(255,182,193,0.5)] rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-primary"
							placeholder="Enter community name"
						/>
					</div>

					<div>
						<label htmlFor="description" className="block font-bold text-sm uppercase tracking-widest mb-1">
							Description
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="w-full px-3 py-2 border-2 border-[rgba(255,182,193,0.5)] rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-primary"
							placeholder="Enter community description"
						/>
					</div>

					<div>
						<label htmlFor="timeLimit" className="block font-bold text-sm uppercase tracking-widest mb-1">
							Time Limit (MIN)
						</label>
						<div className="border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white dark:bg-gray-800 rounded-lg flex items-center">
							<input
								id="timeLimit"
								type="range"
								min="1"
								max="120"
								step="1"
								value={timeLimit}
								onChange={(e) => setTimeLimit(parseInt(e.target.value))}
								className="w-full mr-4 accent-pink-primary"
							/>
							<div className="min-w-[80px] bg-pink-light py-1 px-3 font-mono font-bold text-center border-2 border-[rgba(255,182,193,0.5)] rounded-lg">
								{timeLimit} MIN
							</div>
						</div>
					</div>

					<div>
						<label htmlFor="baseFee" className="block font-bold text-sm uppercase tracking-widest mb-1">
							Base Fee (SOL)
						</label>
						<div className="border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white dark:bg-gray-800 rounded-lg flex items-center">
							<input
								id="baseFee"
								type="range"
								min="0"
								max="10"
								step="0.1"
								value={baseFee}
								onChange={(e) => setBaseFee(parseFloat(e.target.value))}
								className="w-full mr-4 accent-pink-primary"
							/>
							<div className="min-w-[80px] bg-pink-light py-1 px-3 font-mono font-bold text-center border-2 border-[rgba(255,182,193,0.5)] rounded-lg">
								{baseFee} SOL
							</div>
						</div>
					</div>

					{!connected && (
						<div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 p-3 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg">
							Please connect your wallet to create a community
						</div>
					)}

					{connected && !isWalletLinked && (
						<div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 p-3 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg">
							Please link your wallet to your account first
						</div>
					)}

					<div className="flex justify-end gap-4 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border-2 border-[rgba(255,182,193,0.5)] text-sm font-bold uppercase tracking-wider rounded-[20px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !name.trim() || !connected || !isWalletLinked}
							className="px-4 py-2 bg-[rgba(255,182,193,0.5)] hover:bg-[rgba(255,182,193,0.6)] text-black font-bold border-2 border-[rgba(255,182,193,0.5)] rounded-[20px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
						>
							{loading ? 'Creating...' : 'Create Community'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
