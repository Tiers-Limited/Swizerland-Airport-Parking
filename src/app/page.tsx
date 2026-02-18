'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { buildQueryString } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { 
  PageTransition, 
  FadeIn, 
  SlideUp, 
  StaggerContainer, 
  StaggerItem,
  AnimatedCard,
  motion 
} from '@/components/animations';

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [searchData, setSearchData] = useState({
    startDate: '',
    endDate: '',
    arrivalTime: '10:00',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = buildQueryString({
      startDate: searchData.startDate,
      endDate: searchData.endDate,
      arrivalTime: searchData.arrivalTime,
    });
    router.push(`/zurich?${query}`);
  };

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t('home.featSecure'),
      description: t('home.featSecureDesc'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: t('home.featShuttle'),
      description: t('home.featShuttleDesc'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t('home.featPrice'),
      description: t('home.featPriceDesc'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t('home.featQuick'),
      description: t('home.featQuickDesc'),
    },
  ];

  const steps = [
    {
      number: '01',
      title: t('home.step1Title'),
      description: t('home.step1Desc'),
    },
    {
      number: '02',
      title: t('home.step2Title'),
      description: t('home.step2Desc'),
    },
    {
      number: '03',
      title: t('home.step3Title'),
      description: t('home.step3Desc'),
    },
    {
      number: '04',
      title: t('home.step4Title'),
      description: t('home.step4Desc'),
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-baby-blue-50 to-white overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-baby-blue-200" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
            <FadeIn className="text-center max-w-3xl mx-auto mb-12">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {t('home.heroTitle1')}
                <span className="text-gradient"> {t('home.heroTitleHighlight')}</span>
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {t('home.heroDescription')}
              </motion.p>
            </FadeIn>

            <SlideUp delay={0.3}>
              <Card variant="default" padding="lg" className="max-w-4xl mx-auto shadow-large">
                <form onSubmit={handleSearch}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('home.dropOffDate')}
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={searchData.startDate}
                        onChange={(e) => setSearchData({ ...searchData, startDate: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('home.pickUpDate')}
                      </label>
                      <input
                        type="date"
                        required
                        min={searchData.startDate || new Date().toISOString().split('T')[0]}
                        value={searchData.endDate}
                        onChange={(e) => setSearchData({ ...searchData, endDate: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('home.arrivalTime')}
                      </label>
                      <input
                        type="time"
                        required
                        value={searchData.arrivalTime}
                        onChange={(e) => setSearchData({ ...searchData, arrivalTime: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button type="submit" className="w-full" size="lg">
                        {t('home.searchButton')}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </SlideUp>

            {/* Trust badges */}
            <FadeIn delay={0.5}>
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 mt-12 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('home.trustFreeCancellation')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('home.trustNoHiddenFees')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('home.trustSecurePayment')}
                </div>
              </div>
            </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.whyChoose')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.whyChooseDesc')}
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="text-center h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-baby-blue-100 text-baby-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.howItWorksTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.howItWorksDesc')}
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <StaggerItem key={index}>
                <div className="relative h-full">
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-baby-blue-200" />
                  )}
                  <motion.div 
                    className="relative bg-white rounded-2xl p-6 shadow-soft border border-gray-100 h-full"
                    whileHover={{ y: -5, boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-5xl font-bold text-baby-blue-100 mb-4">{step.number}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </motion.div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.6} className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="secondary" size="lg">
                {t('common.learnMore')}
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-baby-blue-500">
        <FadeIn className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('home.readyTitle')}
          </h2>
          <p className="text-lg text-baby-blue-100 mb-8 max-w-2xl mx-auto">
            {t('home.readySubtitle')}
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/zurich">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-baby-blue-600 hover:bg-gray-50"
              >
                {t('home.findParking')}
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-baby-blue-600 text-white hover:bg-baby-blue-700 border border-baby-blue-400"
              >
                {t('home.createAccount')}
              </Button>
            </Link>
          </motion.div>
        </FadeIn>
      </section>

      <Footer />
      </div>
    </PageTransition>
  );
}
