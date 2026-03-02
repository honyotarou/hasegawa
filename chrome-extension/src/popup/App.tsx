import React, { useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { useDiagnosis } from './hooks/useDiagnosis';
import { useStorage } from './hooks/useStorage';
import { ConfirmScreen } from './screens/ConfirmScreen';
import { DoneScreen } from './screens/DoneScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';

export function App() {
  const { state, dispatch, goToScreen, pendingCount, pendingRehab, pendingDiag, canSubmit } =
    useAppState();
  const storage = useStorage();
  const diagnosis = useDiagnosis(storage.settings.diagnosisMaster);

  useEffect(() => {
    if (!storage.isLoaded) return;
    if (state.screen !== 'SETUP') return;
    goToScreen(storage.isConfigured ? 'MAIN' : 'SETUP');
  }, [storage.isLoaded, storage.isConfigured, state.screen, goToScreen]);

  if (!storage.isLoaded) return null;

  switch (state.screen) {
    case 'SETUP':
      return <SetupScreen storage={storage} goToScreen={goToScreen} />;
    case 'MAIN':
      return (
        <MainScreen
          state={state}
          dispatch={dispatch}
          storage={storage}
          pendingCount={pendingCount}
          pendingRehab={pendingRehab}
          pendingDiag={pendingDiag}
          canSubmit={canSubmit}
          diagnosis={diagnosis}
        />
      );
    case 'CONFIRM':
      return (
        <ConfirmScreen
          state={state}
          dispatch={dispatch}
          storage={storage}
          diagnosis={diagnosis}
        />
      );
    case 'DONE':
      return <DoneScreen result={state.lastSubmitResult} dispatch={dispatch} />;
    case 'SETTINGS':
      return <SettingsScreen storage={storage} goToScreen={goToScreen} />;
    default:
      return null;
  }
}
