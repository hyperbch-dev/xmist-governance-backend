// Enable support for Express apps.
const express = require("express");
const router = express.Router();
const ethers = require("ethers");

const snapshot = require("../src/snapshot")

const requireParam = function(params, param) {
  if (!params[param]) {
    throw Error(`'${param}' parameter is not found in the request body`);
  }
}


const getProposal = async function (req, res) {
  const params = req.params;

  try {
    requireParam(params, "proposalId");
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const proposal = req.app.queries.getProposal.get({
    proposalId: params.proposalId,
  });

  if (!proposal) {
    res.status(404).json({ error: "proposal not found" });
    return;
  }

  res.send(proposal);
};
router.get("/:proposalId", getProposal);

// create proposal
const proposal = async function (req, res) {
  const params = req.body || {};
  try {
    requireParam(params, "proposalId");
    requireParam(params, "title");
    requireParam(params, "content");
    requireParam(params, "options");
    requireParam(params, "snapshotBlock");
    requireParam(params, "endBlock");
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  // generate snapshot
  const balanceMap = await snapshot(params.snapshotBlock);

  // insert snapshot
  const insert = req.app.queries.addSnapshot;
  const insertMany = req.app.sql.transaction((entries) => {
    for (const entry of entries) insert.run({ snapshotBlock: params.snapshotBlock, ...entry });
  });

  const values = Object.keys(balanceMap).map(key => ({ address: key, amount: balanceMap[key].toString() }));
  insertMany(values);

  // insert proposal
  params.options = JSON.stringify(params.options);
  req.app.queries.addProposal.run({ ...params });

  res.end();
};
// create proposal
router.post("/", proposal);

module.exports = router;
