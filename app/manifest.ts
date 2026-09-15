import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest { return { name: 'Investly', short_name: 'Investly', description: 'Investly', start_url: '/', display: 'standalone', background_color: 'white', theme_color: '#1368e9', lang: 'fa', dir: 'rtl', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] } }
