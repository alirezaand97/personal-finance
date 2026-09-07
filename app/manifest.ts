import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest { return { name: 'همراه مالی', short_name: 'همراه مالی', description: 'دفتر مالی شخصی آفلاین', start_url: '/', display: 'standalone', background_color: '#f7faf8', theme_color: '#2f9b73', lang: 'fa', dir: 'rtl', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] } }
