import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';

export const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-primary mb-4 animate-pageFadeIn">
          {t('about.title')}
        </h1>
        <p className="text-xl text-secondary max-w-3xl mx-auto">
          {t('about.subtitle')}
        </p>
      </div>

      {/* What is DEMOCRATIX */}
      <section className="mb-16">
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🗳️</span>
            <h2 className="text-3xl font-bold text-primary">{t('about.what.title')}</h2>
          </div>
          <p className="text-lg text-secondary leading-relaxed mb-4">
            {t('about.what.description1')}
          </p>
          <p className="text-lg text-secondary leading-relaxed">
            {t('about.what.description2')}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center">
          {t('about.howItWorks.title')}
        </h2>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 hover:shadow-lg transition-all hover-lift"
              style={{ animationDelay: `${step * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">{step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">
                    {t(`about.howItWorks.step${step}.title`)}
                  </h3>
                  <p className="text-secondary">
                    {t(`about.howItWorks.step${step}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center">
          {t('about.features.title')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['blockchain', 'anonymous', 'transparent', 'decentralized', 'secure', 'ipfs'].map((feature) => (
            <div
              key={feature}
              className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-all hover-lift"
            >
              <div className="text-5xl mb-4">{t(`about.features.${feature}.icon`)}</div>
              <h3 className="text-xl font-bold text-primary mb-2">
                {t(`about.features.${feature}.title`)}
              </h3>
              <p className="text-sm text-secondary">
                {t(`about.features.${feature}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center">
          {t('about.faq.title')}
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((faqNum) => (
            <FAQItem
              key={faqNum}
              question={t(`about.faq.q${faqNum}.question`)}
              answer={t(`about.faq.q${faqNum}.answer`)}
            />
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center">
          {t('about.tech.title')}
        </h2>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <span>⚡</span> {t('about.tech.frontend')}
              </h3>
              <ul className="space-y-2 text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> React 18 + TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> Vite + Tailwind CSS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> MultiversX SDK
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> i18next (FR/EN/ES)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <span>🔗</span> {t('about.tech.backend')}
              </h3>
              <ul className="space-y-2 text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> Rust Smart Contracts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> MultiversX Blockchain
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> IPFS (Pinata)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">▸</span> Cryptographic Hashing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-xl p-10">
          <h2 className="text-3xl font-bold text-primary mb-4">
            {t('about.cta.title')}
          </h2>
          <p className="text-lg text-secondary mb-6 max-w-2xl mx-auto">
            {t('about.cta.description')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(RouteNamesEnum.elections)}
              className="bg-btn-primary text-btn-primary px-8 py-4 rounded-lg hover:bg-btn-hover transition-all font-semibold text-lg hover:scale-105"
            >
              {t('about.cta.viewElections')}
            </button>
            <button
              onClick={() => navigate(RouteNamesEnum.createElection)}
              className="bg-secondary text-primary border-2 border-secondary px-8 py-4 rounded-lg hover:bg-tertiary transition-all font-semibold text-lg"
            >
              {t('about.cta.createElection')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// FAQ Item Component with collapsible functionality
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-tertiary transition-colors"
      >
        <span className="font-semibold text-primary pr-4">{question}</span>
        <span className={`text-accent text-2xl flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-secondary bg-primary animate-slideUp">
          <p className="text-secondary leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};
