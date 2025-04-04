import type { Metadata } from 'next';
import { SolanaWalletProvider } from '@/components/wallet/SolanaWalletProvider';
import { Geist, Geist_Mono, Silkscreen, Poppins, Quicksand } from 'next/font/google';
import '@/styles/globals.css';
import GlobalHeader from '@/components/global/GlobalHeader';
import GlobalFooter from '@/components/global/GlobalFooter';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const silkscreen = Silkscreen({
	weight: '400',
	variable: '--font-silkscreen',
	subsets: ['latin'],
});

const poppins = Poppins({
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-poppins',
	subsets: ['latin'],
	display: 'swap',
});

const quicksand = Quicksand({
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-quicksand',
	subsets: ['latin'],
	display: 'swap',
});

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
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} ${poppins.variable} ${quicksand.variable} antialiased`}
			>
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
