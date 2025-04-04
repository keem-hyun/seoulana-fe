'use client';

import { useState } from 'react';

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
					className="w-full px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={handleSearch}
					className="absolute right-2 top-1/2 -translate-y-1/2 bg-black dark:bg-white text-white dark:text-black px-4 py-1 text-sm font-bold border-2 border-black dark:border-white"
				>
					Search
				</button>
			</div>
		</div>
	);
}
