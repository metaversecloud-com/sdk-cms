export type ClickableLinkType = {
  clickableLink: string;
  clickableLinkTitle: string;
  isForceLinkInIframe: boolean;
  isOpenLinkInDrawer: boolean;
  linkId: string;
};

export type DroppedAssetType = {
  id: string;
  uniqueName: string;
  topLayerURL: string;
  bottomLayerURL: string;
  position: {
    x: number;
    y: number;
  };
  links?: ClickableLinkType[];
  clickableLinks?: ClickableLinkType[];
  assetName: string;
};
