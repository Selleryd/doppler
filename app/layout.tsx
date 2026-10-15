import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Doppler Wellness', description: 'Personalized mental health care for older adults, families and senior living communities.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
