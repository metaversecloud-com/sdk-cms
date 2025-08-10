import {
  ActionType,
  InitialState,
  SET_ERROR,
  SET_HAS_SETUP_BACKEND,
  SET_INTERACTIVE_PARAMS,
  SET_CONTENT_MAP,
  SET_IS_ADMIN,
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        hasInteractiveParams: true,
        profileId: payload.profileId,
        sceneDropId: payload.sceneDropId,
      };
    case SET_HAS_SETUP_BACKEND:
      return {
        ...state,
        ...payload,
        hasSetupBackend: true,
      };
    case SET_IS_ADMIN:
      return {
        ...state,
        isAdmin: payload.isAdmin,
        error: "",
      };
    case SET_ERROR:
      return {
        ...state,
        error: payload?.error,
      };
    case SET_CONTENT_MAP:
      return {
        ...state,
        contentMap: payload,
      };

    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
