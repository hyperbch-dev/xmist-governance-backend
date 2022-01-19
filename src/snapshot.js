const ethers = require("ethers");
const fs = require("fs");
const { argv } = require("process");

try {
  fs.mkdirSync("data");
} catch {}

// encoded topic corresponding to Transfer event
const sep20TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// smartbch rpc url
const rpcUrl = "https://smartbch.fountainhead.cash/mainnet";

// BigNumber zero
const zero = ethers.BigNumber.from(0);

async function index(targetBlockNumber) {
  // optional parameter to index only until this block number, otherwise until blockchain tip
  if (targetBlockNumber) {
    targetBlockNumber = parseInt(targetBlockNumber);
    if (!targetBlockNumber) {
      throw Error("Invalid target block number")
    }
  }

  // instantiate ethers provider
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl, {
    name: "smartbch",
    chainId: 10000,
  });
  const now = await provider._getFastBlockNumber();
  const scanBlockStop = targetBlockNumber || now;

  // block batching size 10000 is maximum
  const blockBatch = 10000;

  // lookup the checkpoint available
  const files = fs.readdirSync("data");
  const blocks = files.map(val => parseInt(val.slice(0, -5))).sort((a,b) => a-b).filter(val => val % blockBatch === 0 && val < scanBlockStop);

  // start at the checkpoint block found, otherwise nearest round block before first mistbar event
  const scanBlockStart = blocks.length ? blocks.slice(-1)[0] : 990000;

  // load checkpoint data if available
  let balanceMap = {};
  if (blocks.length) {
    const data = JSON.parse(fs.readFileSync(`data/${scanBlockStart}.json`, "utf8"));
    for (log of data) {
      balanceMap[log.address] = ethers.BigNumber.from(log.bal);
    }
  }

  // main processing
  for (let i = scanBlockStart + 1; i < scanBlockStop; i += blockBatch) {
    const nextStop = i + blockBatch - 1;
    const to = nextStop > scanBlockStop ? scanBlockStop : nextStop;

    console.log(`Processing blocks from ${i} to ${to}`);

    const mistBarAddress = "0xC41C680c60309d4646379eD62020c534eB67b6f4";
    const params = {
      address: mistBarAddress,
      fromBlock: i,
      toBlock: to,
      topics: [sep20TransferTopic, null, null],
    };

    // retreive logs and process xMIST transfers
    const logs = await provider.getLogs(params);
    for (const log of logs) {
      const from = "0x" + log.topics[1].substring(26);
      const to = "0x" + log.topics[2].substring(26);

      if (to !== ethers.constants.AddressZero) {
        balanceMap[to] = (balanceMap[to] || zero).add(ethers.BigNumber.from(log.data));
      }

      if (from !== ethers.constants.AddressZero) {
        balanceMap[from] = balanceMap[from].sub(ethers.BigNumber.from(log.data));
        if (balanceMap[from].eq(0)) {
          // delete zero balances
          delete balanceMap[from];
        }
      }
    }

    // transform results and store checkpoint
    const values = Object.keys(balanceMap).map(key => ({ address: key, bal: balanceMap[key].toString() }));
    fs.writeFileSync(`data/${params.toBlock}.json`, JSON.stringify(values, null, 2));
  }

  return balanceMap;
}

module.exports = index
