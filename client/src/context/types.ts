export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";
export const SET_CONTENT_MAP = "SET_CONTENT_MAP";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export interface InitialState {
  isAdmin?: boolean;
  droppedAsset?: { assetName: string; bottomLayerURL: string; id: string; topLayerURL: string };
  error?: string;
  hasInteractiveParams?: boolean;
  hasSetupBackend?: boolean;
  profileId?: string;
  sceneDropId?: string;
  visitor?: { isAdmin: boolean; displayName: string };
  contentMap?: Record<string, AssetInfo>;
}

export type ActionType = {
  type: string;
  payload: InitialState;
};

export interface SearchBarProps {
  value: string;
  onChange: (newTerm: string) => void;
  onSearch: (newValue?: string) => void;
}

export interface AssetInfo {
  assetId: string;
  uniqueName: string;
  topLayerURL: string;
  bottomLayerURL: string;
  position: {
    x: number;
    y: number;
  };
  links: ClickableLinkInfo[];
  assetName: string;
}

export interface ClickableLinkInfo {
  clickableLink: string;
  clickableLinkTitle: string;
  isForceLinkInIframe: boolean;
  isOpenLinkInDrawer: boolean;
  linkId: string;
}
