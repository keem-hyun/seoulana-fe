import Image from 'next/image';
import Link from 'next/link';

export default function GlobalHeader() {
	return (
		<header className="sticky top-0 w-full py-6 px-6 flex justify-between items-center relative z-50 bg-gradient-to-br from-pink-light/40 via-white to-purple-light/40 backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<div className="w-12 h-12 bg-white rounded-xl shadow-pink flex items-center justify-center p-2">
					<Image src="/images/kasoro_logo.png" alt="Kasoro Logo" width={32} height={32} />
				</div>
				<h2 className="text-xl font-bold text-pink-primary">
					<Link href="/">KASORO</Link>
				</h2>
			</div>
			<nav className="hidden md:flex items-center gap-6">
				<a href="#features" className="text-purple-dark font-medium hover:text-pink-primary transition-colors">
					Features
				</a>
				<a href="#how-it-works" className="text-purple-dark font-medium hover:text-pink-primary transition-colors">
					How It Works
				</a>
				<Link
					href="/kasoro"
					className="px-5 py-2 bg-gradient-to-r from-pink-primary to-purple-primary text-purple-dark rounded-full font-medium shadow-md hover:shadow-pink transition-all hover:scale-105"
				>
					Launch App
				</Link>
			</nav>
		</header>
	);
}
