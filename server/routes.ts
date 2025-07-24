import express from "express";
import {
  handleDropAsset,
  handleGetGameState,
  handleRemoveDroppedAssetsByUniqueName,
  handleAssetSearch,
  handleAddToList,
  handleGetList,
  handleUpdateLink,
  handleResetList,
  handleTeleport,
  handleFireToast,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();
const SERVER_START_DATE = new Date();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

// Dropped Assets
router.get("/game-state", handleGetGameState);
router.get("/asset-search", handleAssetSearch);
router.get("/content-list", handleGetList);
router.put("/teleport", handleTeleport);
router.put("/update-link", handleUpdateLink);
router.put("/reset-list", handleResetList);
router.post("/add-to-list", handleAddToList);
router.post("/dropped-asset", handleDropAsset);
router.post("/remove-dropped-assets", handleRemoveDroppedAssetsByUniqueName);

// World
router.put("/world/fire-toast", handleFireToast);

export default router;
