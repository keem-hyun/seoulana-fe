'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { api } from '@/api';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import axios from 'axios';
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Import from contract target types
import { Kasoro } from '../../../../contract/target/types/kasoro';
import kasoroIdl from '../../../../contract/target/idl/kasoro.json';

// Placeholder for program ID - replace with actual ID from lib.rs
const PROGRAM_ID = new PublicKey('CEnBjSSjuoL13LtgDeALeAMWqSg9W7t1J5rtjeKNarAM');

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
	baseFeePercentage: number;
}

export default function CreateCommunityDialog({ isOpen, onClose, userWalletAddress }: CreateCommunityDialogProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [timeLimit, setTimeLimit] = useState(30);
	const [baseFee, setBaseFee] = useState(0.1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const router = useRouter();
	const { connected, publicKey, sendTransaction } = useWallet();
	console.log('basefee:', baseFee);
	const isWalletLinked = !!userWalletAddress;

	const uploadToPinata = async (file: File): Promise<string> => {
		try {
			setUploadingImage(true);
			toast.loading('Uploading image...', { id: 'upload' });
			console.log('[이미지 업로드] 시작: ', file.name, file.size);

			const formData = new FormData();
			formData.append('file', file);

			const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
					pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
				},
			});

			const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
			console.log('[이미지 업로드] 성공 - URL: ', url);
			toast.success('Image uploaded successfully!', { id: 'upload' });
			return url;
		} catch (error) {
			console.error('[이미지 업로드] 실패: ', error);
			toast.error('Failed to upload image', { id: 'upload' });
			throw new Error('Failed to upload image');
		} finally {
			setUploadingImage(false);
		}
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				// 5MB limit
				toast.error('Image size should be less than 5MB');
				return;
			}

			setImage(file);
			// 미리보기 생성
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

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
			// Upload image if one is selected
			let imageURL = null;
			if (image) {
				try {
					console.log('[커뮤니티 생성] 이미지 업로드 시작');
					imageURL = await uploadToPinata(image);
					console.log('[커뮤니티 생성] 이미지 업로드 완료 - URL:', imageURL);
				} catch (error) {
					console.error('[커뮤니티 생성] 이미지 업로드 실패:', error);
					toast.error('Failed to upload image, but continuing with community creation');
					// Continue with community creation even if image upload fails
				}
			}

			// Check if community name already exists
			try {
				const response = await api.get('/communities');
				const communities: any = response.data;
				const existingCommunity = communities.find(
					(community: any) => community.name.toLowerCase() === name.toLowerCase()
				);

				if (existingCommunity) {
					setLoading(false);
					setError(`A community with the name "${name}" already exists. Please choose a different name.`);
					toast.error(`A community with the name "${name}" already exists.`);
					return;
				}
			} catch (error) {
				console.error('Error checking community name:', error);
				// Continue with community creation if the check fails
			}
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
						new anchor.BN(baseFee * LAMPORTS_PER_SOL), // Base fee percentage
						2, // fee_multiplier (example value)
						new PublicKey('5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'), // lst_addr (using user's public key as placeholder)
						false, // ai_moderation
						[0.4, 0.3, 0.2, 0.1]
					)
					.accounts({
						initializer: publicKey,
						community: communityPda,
						vault: vaultPda,
						systemProgram: web3.SystemProgram.programId,
					})
					.instruction()
			);

			const latestBlockhash = await connection.getLatestBlockhash();
			// Send transaction to the network
			const signature = await sendTransaction(transaction, connection);

			// Wait for confirmation
			
			await connection.confirmTransaction(
				{
					signature,
					blockhash: latestBlockhash.blockhash,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
				},
				'confirmed'
			);

			const communityAccount = await program.account.communityState.fetch(communityPda);
			console.log('CommunityState account pubkey:', communityPda.toString());
			// console.log('vault account pubkey:', vaultPda.toString());
			// console.log('CommunityState account:', communityAccount);

			// console.log('CommunityState name:', communityAccount.communityName);
			// console.log('CommunityState timeLimit:', communityAccount.timeLimit);
			// console.log('CommunityState baseFeePercentage:', communityAccount.initBaseFee);
			// //  console.log("CommunityState fee_multiplier:", communityAccount.fee_multiplier);
			// console.log('CommunityState prize_ratio:', communityAccount.prizeRatio);
			// console.log('CommunityState active:', communityAccount.active);
			// console.log('CommunityState lstAddr:', communityAccount.lstAddr.toString());
			// console.log('CommunityState basefee_vault:', communityAccount.basefeeVault.toString());
			//  console.log("CommunityState aiModeration:", communityAccount.ai_moderation);

			// Call the backend API to register the community in the database
			const requestBody = {
				name,
				description,
				timeLimit,
				baseFeePercentage: baseFee,
				walletAddress: publicKey.toString(),
				imageURL: imageURL,
			};
			console.log('[커뮤니티 생성] API 요청 데이터:', requestBody);

			const { data } = await api.post<CommunityResponse>('/communities', requestBody);

			console.log('[커뮤니티 생성] API 응답 데이터:', data);
			console.log('[커뮤니티 생성] 이미지 URL 확인:', imageURL);

			// Reset form
			setName('');
			setDescription('');
			setTimeLimit(30);
			setBaseFee(0.1);
			setImage(null);
			setImagePreview(null);

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
			<div className="bg-white dark:bg-gray-800 rounded-[20px] overflow-hidden shadow-[0_4px_0_rgba(255,182,193,0.5)] group transition-all duration-300 flex flex-col border-2 border-[rgba(255,182,193,0.5)] p-6 w-full max-w-md max-h-[90vh]">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Create New Community</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						✕
					</button>
				</div>

				<div className="overflow-y-auto pr-2">
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 p-3 text-red-800 dark:text-red-300 text-sm rounded-lg">
								{error}
							</div>
						)}

						<div className="pb-2">
							<h1 className="text-2xl font-bold tracking-widest uppercase mb-4">New Community</h1>
							<hr className="border-gray-200 dark:border-gray-700 mb-6" />
						</div>

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

						<div>
							<label htmlFor="image" className="block font-bold text-sm uppercase tracking-widest mb-1">
								COMMUNITY PFP
							</label>
							<div className="border-2 border-[rgba(255,182,193,0.5)] p-4 bg-white dark:bg-gray-800 rounded-lg">
								<div className="flex items-center gap-2">
									<label className="cursor-pointer flex items-center gap-2">
										<div
											className={`w-10 h-10 bg-[rgba(255,182,193,0.5)] hover:bg-[rgba(255,182,193,0.6)] rounded-md flex items-center justify-center ${
												uploadingImage ? 'opacity-50' : ''
											}`}
										>
											{uploadingImage ? (
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
														clipRule="evenodd"
													/>
												</svg>
											)}
										</div>
										<span className="text-sm text-gray-600 dark:text-gray-300">
											{imagePreview ? 'Change PFP' : 'Upload PFP'}
										</span>
										<input
											type="file"
											id="image"
											accept=".jpg,.jpeg,.png,.gif"
											onChange={handleImageChange}
											disabled={uploadingImage}
											className="hidden"
										/>
									</label>
								</div>
								{imagePreview && (
									<div className="relative mt-4">
										<img
											src={imagePreview}
											alt="Preview"
											className="max-w-full h-auto rounded-lg border-2 border-[rgba(255,182,193,0.5)]"
										/>
										<button
											type="button"
											onClick={() => {
												setImage(null);
												setImagePreview(null);
											}}
											className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-4 w-4"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									</div>
								)}
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
		</div>
	);
}
