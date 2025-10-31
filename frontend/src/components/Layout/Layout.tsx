import { PropsWithChildren } from 'react';

import { Footer, Header, SkipLink } from 'components';
import { AuthRedirectWrapper } from 'wrappers';

// prettier-ignore
const styles = {
  layoutContainer: 'layout-container flex min-h-screen flex-col bg-accent transition-all duration-200 ease-out',
  mainContainer: 'main-container flex flex-grow items-stretch justify-center'
} satisfies Record<string, string>;

export const Layout = ({ children }: PropsWithChildren) => (
  <div className={styles.layoutContainer}>
    <SkipLink />
    <Header />

    <main id="main-content" className={styles.mainContainer}>
      <AuthRedirectWrapper>{children}</AuthRedirectWrapper>
    </main>

    <Footer />
  </div>
);
