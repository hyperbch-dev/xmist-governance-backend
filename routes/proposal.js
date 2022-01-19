// Enable support for Express apps.
const express = require("express");
const router = express.Router();

const { snapshotExists, generateSnapshot, requireParam } = require("../src/utils")

const getAllProposals = async function (req, res) {
  try {
    const proposals = req.app.queries.listProposals.all();
    proposals.forEach(val => {
      val.options = JSON.parse(val.options);
      val.histogram = JSON.parse(val.histogram);
    });

    res.send(proposals);
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }
};
router.get("/all", getAllProposals);

const getProposal = async function (req, res) {
  try {
    const params = req.params;

    requireParam(params, "proposalId");

    const proposal = req.app.queries.getProposal.get({
      proposalId: params.proposalId,
    });

    if (!proposal) {
      res.status(404).json({ error: "proposal not found" });
      return;
    }

    res.send(proposal);
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }
};
router.get("/:proposalId", getProposal);

// create proposal
const proposal = async function (req, res) {
  try {
    const params = req.body || {};

    requireParam(params, "proposalId");
    requireParam(params, "title");
    requireParam(params, "content");
    requireParam(params, "options");
    requireParam(params, "snapshotBlock");
    requireParam(params, "endBlock");

    if (params.options.length < 2) {
      throw Error("At least 2 options are required for a voting proposal");
    }

    // insert snapshot
    if (!snapshotExists(req.app, params.snapshotBlock)) {
      await generateSnapshot(req.app, params.snapshotBlock);
    }

    // serialize json fields
    params.histogram = JSON.stringify(Array(params.options.length).fill(0));
    params.options = JSON.stringify(params.options);

    params.voteCount = 0;

    // insert proposal
    req.app.queries.addProposal.run({ ...params });

    res.end();
  } catch (e) {
    console.trace(e)
    res.status(500).json({ error: e.message });
    return;
  }
};
// create proposal
router.post("/", proposal);

module.exports = router;
