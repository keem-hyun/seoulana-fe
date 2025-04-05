'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchCommunitiesProps {
	onSearch: (term: string) => void;
}

export default function SearchCommunities({ onSearch }: SearchCommunitiesProps) {
	const [searchTerm, setSearchTerm] = useState('');

	const handleSearch = () => {
		onSearch(searchTerm);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	return (
		<div className="w-full mb-8">
			<div className="relative">
				<input
					type="text"
					placeholder="Search communities..."
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						onSearch(e.target.value); // 실시간 검색을 위해 즉시 검색어 전달
					}}
					onKeyPress={handleKeyPress}
					className="w-full px-4 py-3 pl-12 rounded-full bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 shadow-inner transition-all"
				/>
				<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
					<Search size={18} />
				</div>
				<button
					onClick={handleSearch}
					className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white px-5 py-1.5 text-sm font-medium rounded-full shadow-sm hover:shadow transition-all hover:opacity-90"
				>
					Search
				</button>
			</div>
		</div>
	);
}
