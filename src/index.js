const ipfsGateway = 'https://ipfs.kleros.io'
const subgraphURL = 'https://api.thegraph.com/subgraphs/name/proveuswrong/thetruthpost'

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
        disputeEntities(where: {id: "${disputeID}"}) {
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
    return data.disputeEntities[0];
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

  const { disputeID, arbitrableContractAddress, arbitrableChainID, arbitrableJsonRpcUrl } = scriptParameters;
  if (!arbitrableContractAddress || !arbitrableChainID || !arbitrableJsonRpcUrl || !disputeID) {

    resolveScript({});
  }
  const article = (await getArticleByDisputeID(subgraphURL, disputeID)).article;

  const articleContent = await getArticleContent(article.articleID);
  resolveScript({
    arbitrableInterfaceURI: `https://truthpost.news/${arbitrableChainID}/${article.id}`,
    title: articleContent.title,
    description: articleContent.description
  });

};

exports.getMetaEvidence = getMetaEvidence;
