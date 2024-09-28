/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ykvteidckeylmsej.public.blob.vercel-storage.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
    // distDir: 'build',
};

export default nextConfig;
