import classNames from 'classnames';
import democratixLogo from '../../assets/img/democratix-logo.png';

// prettier-ignore
const styles = {
  logo: 'logo flex items-center justify-center gap-3 cursor-pointer hover:opacity-75',
  logoImage: 'logo-image h-8 w-8 sm:h-10 sm:w-10 object-contain transition-all duration-200 ease-in-out',
  logoText: 'logo-text text-xl lg:text-2xl font-medium flex text-primary relative -top-0.5 leading-none transition-all duration-200 ease-in-out lg:top-0',
  logoTextHidden: 'logo-text-hidden hidden md:!flex'
} satisfies Record<string, string>;

interface LogoPropsType {
  hideTextOnMobile?: boolean;
}

export const Logo = ({ hideTextOnMobile }: LogoPropsType) => (
  <div className={styles.logo}>
    <img
      src={democratixLogo}
      alt="DEMOCRATIX Logo"
      className={styles.logoImage}
    />

    <div
      className={classNames(styles.logoText, {
        [styles.logoTextHidden]: hideTextOnMobile
      })}
    >
      DEMOCRATIX
    </div>
  </div>
);
