import { getArticleByDisputeID, getArticleContent } from "./arbitrableSpecificLogic";
import { subgraphURL } from "./constants";

module.exports = getMetaEvidence;


async function getMetaEvidence()  {
  const { disputeID, arbitrableContractAddress, arbitrableChainID, arbitrableJsonRpcUrl } = scriptParameters;

  if (!arbitrableContractAddress || !arbitrableChainID || !arbitrableJsonRpcUrl || !disputeID) {
    resolveScript({});
  }

  const article = (await getArticleByDisputeID(subgraphURL, disputeID)).article;
  const articleContent = await getArticleContent(article.articleID);

  resolveScript({
    arbitrableInterfaceURI: `https://truthpost.news/${arbitrableChainID}/${article.id}`,
  });
};