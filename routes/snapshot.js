// Enable support for Express apps.
const express = require("express");
const router = express.Router();
const { requireParam, snapshotExists, generateSnapshot } = require("../src/utils");

const getSnapshot = async function (req, res) {
  try {
    const params = req.params;

    requireParam(params, "proposalId");

    const proposal = req.app.queries.getSnapshot.get({
      proposalId: params.proposalId,
    });

    if (!proposal) {
      res.status(404).json({ error: "snapshot not found" });
      return;
    }

    res.send(proposal);
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }
};
router.get("/:proposalId", getSnapshot);

// create snapshot
const postSnapshot = async function (req, res) {
  try {
    const params = req.body || {};

    requireParam(params, "snapshotBlock");

    if (snapshotExists(params.snapshotBlock)) {
      res.status(500).json({ error: `Snapshot for block ${params.snapshotBlock} already exists` });
      return;
    }

    await generateSnapshot(req.app, params.snapshotBlock);

    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }
};
// create snapshot
router.post("/", postSnapshot);

module.exports = router;
