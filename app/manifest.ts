import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest { return { name: 'همراه مالی', short_name: 'همراه مالی', description: 'دفتر مالی شخصی', start_url: '/', display: 'standalone', background_color: 'white', theme_color: 'white', lang: 'fa', dir: 'rtl', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] } }
