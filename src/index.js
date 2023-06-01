const ipfsGateway = "https://ipfs.kleros.io";
const SUBGRAPH_ENDPOINT_PREFIX = "https://api.thegraph.com/subgraphs/name";
const subgraphEndpoints = {
  1: `${SUBGRAPH_ENDPOINT_PREFIX}/proveuswrong/thetruthpost`,
  5: `${SUBGRAPH_ENDPOINT_PREFIX}/proveuswrong/thetruthpost-goerli`,
};

const queryTemplate = (endpoint, query) =>
  fetch(endpoint, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
    }),
    method: "POST",
    mode: "cors",
  })
    .then((r) => r.json())
    .then((json) => json.data);

const getArticleByDisputeID = async (subgraphEndpoint, disputeID) => {
  return queryTemplate(
    subgraphEndpoint,
    `{
        disputeEntity(id: "${disputeID}") {
            id
            article{
                id
                articleID
                owner
                category
                bounty
            }
        }
    }`
  ).then((data) => {
    return data.disputeEntity;
  })
    .catch((err) => console.error);
};

const getArticleContent = (articleID) =>
  fetch(ipfsGateway + articleID).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not OK");
    }

    return response.json().then();
  });

async function getMetaEvidence()  {

  const { disputeID, arbitrableChainID, arbitrableContractAddress } = scriptParameters;
  if (!disputeID || !arbitrableChainID) {
    console.log("missing parameters");
    resolveScript({});
    return;
  }

  getArticleByDisputeID(subgraphEndpoints[arbitrableChainID], disputeID).then(function(data) {
    const article = data.article;
    getArticleContent(article.articleID).then(function(articleContent) {
      resolveScript({
        arbitrableInterfaceURI: `https://truthpost.news/0x${parseInt(arbitrableChainID).toString(16)}/${arbitrableContractAddress}/${article.id}`,
        title: articleContent.title,
        description: articleContent.description
      });
    }, console.error);
  }, console.error);
};


