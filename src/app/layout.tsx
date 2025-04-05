import type { Metadata } from 'next';
import { SolanaWalletProvider } from '@/components/wallet/SolanaWalletProvider';
import '@/styles/globals.css';
import GlobalHeader from '@/components/global/GlobalHeader';
import GlobalFooter from '@/components/global/GlobalFooter';

export const metadata: Metadata = {
	title: 'Kasoro | First CommuniFi on Solana',
	description: 'The cutest community-driven platform for content creators and community builders on Solana',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<style>
					{`
						@font-face {
							font-family: 'Bazzi';
							src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@2.1/Bazzi.woff') format('woff');
							font-weight: normal;
							font-style: normal;
						}
					`}
				</style>
			</head>
			<body className="font-['Bazzi'] antialiased">
				<SolanaWalletProvider>
					<GlobalHeader />
					<div className="min-h-screen flex flex-col">
						{children}
						<GlobalFooter />
					</div>
				</SolanaWalletProvider>
			</body>
		</html>
	);
}
