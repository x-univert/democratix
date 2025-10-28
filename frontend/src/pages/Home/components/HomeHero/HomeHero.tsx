import { Fragment, FunctionComponent, MouseEvent, SVGProps } from 'react';
import ArrowUpRightIcon from 'assets/icons/arrow-up-right-icon.svg?react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import {
  useHandleThemeManagement,
  ThemeOptionType
} from 'hooks/useHandleThemeManagement';
import HomeLightThemeIcon from 'assets/img/bright-light-icon.svg?react';
import HomeVibeThemeIcon from 'assets/img/vibe-mode-icon.svg?react';
import HomeDarkThemeIcon from 'assets/icons/home-dark-theme-icon.svg?react';
import { Button } from 'components';
import { DOCUMENTATION_LINK, RouteNamesEnum } from 'localConstants';

import styles from './homeHero.styles';

interface HomeThemeOptionType extends ThemeOptionType {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  backgroundClass: string;
  title: string;
}

const themeExtraProperties: Record<
  string,
  Omit<HomeThemeOptionType, keyof ThemeOptionType>
> = {
  'mvx:dark-theme': {
    icon: HomeDarkThemeIcon,
    title: 'Customizable',
    backgroundClass: 'bg-dark-theme'
  },
  'mvx:vibe-theme': {
    icon: HomeVibeThemeIcon,
    title: 'Vibrant',
    backgroundClass: 'bg-vibe-theme'
  },
  'mvx:light-theme': {
    icon: HomeLightThemeIcon,
    title: 'Ownable',
    backgroundClass: 'bg-light-theme'
  }
};

export const HomeHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { allThemeOptions, activeTheme, handleThemeSwitch } =
    useHandleThemeManagement();

  const handleLogIn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.unlock);
  };

  const homeThemeOptions: HomeThemeOptionType[] = allThemeOptions.map(
    (option) => ({
      ...option,
      ...themeExtraProperties[option.identifier]
    })
  );

  const activeHomeTheme = activeTheme
    ? { ...activeTheme, ...themeExtraProperties[activeTheme.identifier] }
    : null;

  const heroContainerClasses = activeHomeTheme
    ? classNames(styles.heroContainer, activeHomeTheme.backgroundClass)
    : styles.heroContainer;

  return (
    <div className={heroContainerClasses}>
      <div className={styles.heroSectionTop}>
        <div className={styles.heroSectionTopContent}>
          <h1 className={styles.heroTitle}>DEMOCRATIX</h1>

          <p className={styles.heroDescription}>
            {t('homeHero.description')}
          </p>
        </div>

        <div className={styles.heroSectionTopButtons}>
          <Button onClick={handleLogIn}>{t('homeHero.connectWallet')}</Button>

          <a
            target='_blank'
            rel='noreferrer'
            href={DOCUMENTATION_LINK}
            className={styles.heroSectionTopDocButton}
          >
            <span className={styles.heroSectionTopDocButtonText}>
              {t('homeHero.seeDocumentation')}
            </span>

            <ArrowUpRightIcon />
          </a>
        </div>
      </div>

      {activeHomeTheme && (
        <div className={styles.heroSectionBottom}>
          {homeThemeOptions.map((themeOption) => (
            <div
              key={themeOption.identifier}
              onClick={handleThemeSwitch(themeOption.identifier)}
              className={classNames(styles.heroSectionBottomThemeOptions, {
                [styles.heroSectionBottomThemeOptionsOpacityFull]:
                  themeOption.identifier === activeHomeTheme.identifier
              })}
            >
              <div className={styles.heroSectionBottomThemeOption}>
                <themeOption.icon className={styles.themeOptionIcon} />

                <span className={styles.themeOptionTitle}>
                  {themeOption.label}
                </span>
              </div>

              {themeOption.identifier === activeHomeTheme.identifier && (
                <Fragment>
                  <span className={styles.themeOptionActiveDot} />

                  <div className={styles.themeOptionActiveLabel}>
                    {themeOption.title}
                  </div>
                </Fragment>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
