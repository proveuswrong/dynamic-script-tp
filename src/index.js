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
  )
    .then((data) => {
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

async function getMetaEvidence() {
  const { disputeID, arbitrableChainID, arbitrableContractAddress } = scriptParameters;
  if (!disputeID || !arbitrableChainID) {
    console.log("missing parameters");
    resolveScript({});
    return;
  }

  getArticleByDisputeID(subgraphEndpoints[arbitrableChainID], disputeID).then(function (data) {
    const article = data.article;
    getArticleContent(article.articleID).then(function (articleContent) {
      const linkToArticle = `https://truthpost.news/0x${parseInt(arbitrableChainID).toString(
        16
      )}/${arbitrableContractAddress}/${article.id}/`;
      resolveScript({
        arbitrableInterfaceURI: linkToArticle,
        title: `Truth Post Article Dispute: ${articleContent.title}`,
        description: `[The article](${linkToArticle}) from Truth Post, identified by the code ${article.id} and located on the contract address ${arbitrableContractAddress} on network with the ID ${arbitrableChainID}, is under dispute. A challenger has raised concerns regarding the accuracy of the article. Your task is to review the content of the article, any evidence presented, and the curation policy. Based on this information, please vote on the validity of the challenge.\n\nThe article starts after the seperator.\n***\n${articleContent.description}`,
      });
    }, console.error);
  }, console.error);
}

module.exports = { getMetaEvidence };
