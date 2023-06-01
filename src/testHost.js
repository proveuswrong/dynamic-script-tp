const { getMetaEvidence } = require("./index");

global.resolveScript = function (data) {
  console.log(data.description);
};

global.scriptParameters = {
  disputeID: 177,
  arbitrableChainID: 5,
  arbitrableContractAddress: "0xa3f27ae78A327C2608045C7e5b84703de1a8cE99",
};

getMetaEvidence();
