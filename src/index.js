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

const getAllMetaevidences = async (subgraphEndpoint) => {
  return queryTemplate(
    subgraphEndpoint,
    `{
      metaEvidenceEntities(orderBy: id, orderDirection: asc){
        id
        uri
      }
    }`
  )
    .then((data) => {
      return data.metaEvidenceEntities;
    })
    .catch((err) => console.error);
};

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
                challenger
            }
        }
    }`
  )
    .then((data) => {
      return data.disputeEntity;
    })
    .catch((err) => console.error);
};

const getContentOnIPFS = (articleID) =>
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

  const metaEvidencePromise = getAllMetaevidences(subgraphEndpoints[arbitrableChainID]);

  const articlePromise = getArticleByDisputeID(subgraphEndpoints[arbitrableChainID], disputeID).then((articleData) => {
    const article = articleData.article;
    const articleContentPromise = getContentOnIPFS(article.articleID);

    return Promise.all([articleContentPromise]).then(([articleContent]) => {
      return {
        article,
        articleContent,
      };
    });
  });

  Promise.all([metaEvidencePromise, articlePromise])
    .then(([metaEvidence, articleData]) => {
      const { article, articleContent } = articleData;

      const category = article.category;
      const metaevidencePath = metaEvidence.filter((m) => m.id == category)[0].uri;

      const metaevidenceContentPromise = getContentOnIPFS(metaevidencePath).then((metaevidenceContent) => {
        const fileURI = metaevidenceContent.fileURI;
        return { fileURI };
      });

      Promise.all([metaevidenceContentPromise])
        .then(([metaevidenceData]) => {
          const { fileURI } = metaevidenceData;
          const linkToArticle = `https://truthpost.news/0x${parseInt(arbitrableChainID).toString(
            16
          )}/${arbitrableContractAddress}/${article.id}/`;
          resolveScript({
            arbitrableInterfaceURI: linkToArticle,
            title: `Truth Post Article Dispute: ${articleContent.title}`,
            description: `There is a controversy brewing over [an article](${linkToArticle}) from Truth Post. Here are the relevant details:\n\n- Article ID: ${article.id}\n- Contract Address: ${arbitrableContractAddress}\n- Network ID: ${arbitrableChainID}\n\nA critic has challenged the article's accuracy. Your task is to review the content of the article, any evidence presented, and [the curation policy](${ipfsGateway}${fileURI}). Based on this information, please vote on the validity of the challenge.\n\nThe article starts after the separator.\n***\n${articleContent.description}`,
          });
        })
        .catch(console.error);
    })
    .catch(console.error);
}

module.exports = { getMetaEvidence };
