import useLocalStorageState from 'use-local-storage-state';

export enum AppFullScreen {
  yes,
  no,
}

export enum AppPreviewMode {
  always,
  never,
}

export enum AppInstantPrint {
  yes,
  no,
}

export type AppSettings = {
  fullScreen: AppFullScreen,
  preview: AppPreviewMode,
  instantPrint: AppInstantPrint,
};

export default function useAppSettings() {
  return useLocalStorageState<AppSettings>('appSettings', {
    defaultValue: {
      fullScreen: AppFullScreen.no,
      preview: AppPreviewMode.always,
      instantPrint: AppInstantPrint.no,
    },
  })
}