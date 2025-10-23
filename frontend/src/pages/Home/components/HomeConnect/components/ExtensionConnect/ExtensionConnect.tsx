import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FunctionComponent, SVGProps } from 'react';

import ArcLogo from 'assets/img/arc-logo.svg?react';
import BraveLogo from 'assets/img/brave-logo.svg?react';
import ChromeLogo from 'assets/img/chrome-logo.svg?react';
import Circles from 'assets/img/circles.svg?react';
import extensionImage from 'assets/img/extension-image.png';
import FirefoxLogo from 'assets/img/firefox-logo.svg?react';
import WalletBraveLogo from 'assets/img/wallet-brave-logo.svg?react';
import WalletChromeLogo from 'assets/img/wallet-chrome-logo.svg?react';
import WalletFirefoxLogo from 'assets/img/wallet-firefox-logo.svg?react';
import WalletIcon from 'assets/img/web-wallet-icon.svg?react';
import { CHROME_EXTENSION_LINK, FIREFOX_ADDON_LINK } from 'localConstants';
import { BrowserEnum, getDetectedBrowser } from 'lib';

import { BrowserFrame } from './components';
import styles from './extensionConnect.styles';

interface BrowserLogo {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
}

const browserLogos: BrowserLogo[] = [
  { icon: ChromeLogo },
  { icon: FirefoxLogo },
  { icon: ArcLogo },
  { icon: BraveLogo }
];

const getBrowserIcon = (browser?: BrowserEnum) => {
  switch (browser) {
    case BrowserEnum.Firefox:
      return <WalletFirefoxLogo />;
    case BrowserEnum.Brave:
      return <WalletBraveLogo />;
    case BrowserEnum.Chrome:
      return <WalletChromeLogo />;
    default:
      return <WalletIcon />;
  }
};

export const ExtensionConnect = () => {
  const detectedBrowser = getDetectedBrowser();
  const isFirefox = detectedBrowser === BrowserEnum.Firefox;

  const icon = getBrowserIcon(detectedBrowser);

  return (
    <div className={styles.extensionCardContainer}>
      <div className={styles.extensionCardContent}>
        {icon}

        <div className={styles.extensionCardText}>
          <h2 className={styles.extensionCardTitle}>
            MultiversX Wallet Extension
          </h2>

          <p className={styles.extensionCardDescription}>
            The MultiversX DeFi Wallet can be installed on Firefox, Chrome,
            Brave, and other chromium-based browsers. This extension is free and
            secure.
          </p>
        </div>

        <div className={styles.extensionCardDownloadSection}>
          <a
            href={isFirefox ? FIREFOX_ADDON_LINK : CHROME_EXTENSION_LINK}
            target='_blank'
            className={styles.extensionCardLink}
          >
            <span className={styles.extensionCardLinkTitle}>Get Extension</span>

            <FontAwesomeIcon icon={faArrowRightLong} />
          </a>

          <div className={styles.extensionCardLogos}>
            {browserLogos.map(({ icon: Icon }, index) => (
              <Icon key={index} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.extensionCardImage}>
        <Circles className={styles.extensionCardCircles} />

        <BrowserFrame />

        <img src={extensionImage} className={styles.extensionCardScreen} />
      </div>
    </div>
  );
};
