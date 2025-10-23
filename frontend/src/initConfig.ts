import './styles/tailwind.css';
import './styles/style.css';

import { walletConnectV2ProjectId, nativeAuth } from 'config';
import { EnvironmentsEnum, InitAppType } from './lib';

export const config: InitAppType = {
  storage: { getStorageCallback: () => sessionStorage },
  dAppConfig: {
    nativeAuth,
    environment: EnvironmentsEnum.devnet,
    theme: 'mvx:dark-theme',
    providers: {
      walletConnect: {
        walletConnectV2ProjectId
      }
    }
  }
};
