import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { UnlockPanelManager, useGetLoginInfo } from 'lib';

export const Unlock = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useGetLoginInfo();

  const unlockPanelManager = UnlockPanelManager.init({
    loginHandler: () => {
      navigate('/');
    },
    onClose: () => {
      navigate('/');
    }
  });

  const handleOpenUnlockPanel = () => {
    unlockPanelManager.openUnlockPanel();
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
      return;
    }

    handleOpenUnlockPanel();
  }, [isLoggedIn]);

  return null;
};

export default Unlock;
