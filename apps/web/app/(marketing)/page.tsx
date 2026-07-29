import type { Metadata } from 'next';
import { LandingPage } from '@/modules/landing/LandingPage';
import { landingContent } from '@/modules/landing/content';

export const metadata: Metadata = {
  title: landingContent.seo.title,
  description: landingContent.seo.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: landingContent.seo.title,
    description: landingContent.seo.description,
    locale: 'pt_AO',
    type: 'website',
    images: [
      {
        url: '/images/hero.jpg',
        width: 2400,
        height: 1592,
        alt: landingContent.hero.imageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: landingContent.seo.title,
    description: landingContent.seo.description,
    images: ['/images/hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingHomePage() {
  return <LandingPage />;
}
