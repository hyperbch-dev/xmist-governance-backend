// Enable support for Express apps.
const express = require("express");
const router = express.Router();
const ethers = require("ethers");

// const getLog = async function (req, res) {
//   const hash = req.params.hash;
//   if (!hash) {
//     res.status(500).json({ error: "Required parameter 'hash' not supplied" });
//     return;
//   }

//   const log = req.app.queries.getLog.get({
//     hash: hash,
//   });

//   if (!log) {
//     res.status(404).json({ error: "Log not found" });
//     return;
//   }

//   res.send(log.log);
// };
// router.get("/:hash", getLog);

const requireParam = function(params, param) {
  if (!params[param]) {
    throw Error(`'${param}' parameter is not found in the request body`);
  }
}

const vote = async function (req, res) {
  const params = req.body || {};
  try {
    requireParam(params, "sig");
    requireParam(params, "proposalId");
    requireParam(params, "choiceId");
    requireParam(params, "address");
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const message = `I am casting vote for ${params.proposalId} with choice ${params.choiceId}`;
  console.log(1,message, params.sig)
  const address = ethers.utils.verifyMessage(message, params.sig);
  if (address !== params.address) {
    res.status(500).json({ error: `Signature verification failed` });
    return;
  }
  console.log(2)
  const vote = req.app.queries.getVote.get({
    proposalId: params.proposalId,
    address: params.address
  });
  console.log(3)

  if (vote) {
    res.status(500).json({ error: `You already casted your vote on this proposal` });
    return;
  }
  console.log(4)

  req.app.queries.addVote.run({ ...params });
  console.log(5)
  res.end();
};
router.post("/", vote);

module.exports = router;
