/** @type {import('next').NextConfig} */
const nextConfig = {
	/* config options here */
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	reactStrictMode: false,
};

module.exports = nextConfig;
