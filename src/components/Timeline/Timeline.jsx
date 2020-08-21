import React, { useContext } from 'react';
import ApolloClient, { InMemoryCache, gql } from 'apollo-boost';
import { ApolloProvider, useQuery } from '@apollo/react-hooks';

import Account from 'components/Account/Account';
import Post from 'components/Post/Post';
import Stamp from 'components/Stamp/Stamp';
import Parameter from 'components/Parameter/Parameter';
import Token from 'components/Token/Token';
import Countdown from 'components/Countdown/Countdown';
import Poll from 'components/Poll/Poll';
import Choice from 'components/Choice/Choice';
import Period from 'components/Period/Period';
import Contract from 'components/Contract/Contract';
import Placeholder from 'components/Timeline/Placeholder';
import Survey from 'components/Poll/Survey';
import Social from 'components/Social/Social';

import { config } from 'config'
import { defaults } from 'lib/const';

import i18n from 'i18n';
import 'styles/Dapp.css';
import { WalletContext } from 'contexts/Wallet/WalletContext';

export const GET_PROPOSALS = `
{
  proposals(first: 15, orderBy:createdAt, orderDirection:desc) {
    id
    proposalId
    createdAt
    proposalIndex
    startingPeriod
    moloch {
      id
    }
    memberAddress
    applicant
    tributeOffered
    tributeToken
    tributeTokenSymbol
    tributeTokenDecimals
    sharesRequested
    yesVotes
    noVotes
    yesShares
    noShares
    details
    processed
    votingPeriodStarts
    votingPeriodEnds
    gracePeriodEnds
  }
}
`;

const client = new ApolloClient({
  uri: config.graph.moloch,
  cache: new InMemoryCache(),
});

const _getPercentage = (percentageAmount, remainder) => {
  return parseFloat((percentageAmount * 100) / (percentageAmount + remainder), 10);
};

const Feed = (props) => {

  const { address } = useContext(WalletContext);

  const { loading, error, data } = useQuery(gql(GET_PROPOSALS));

  if (loading) return <Placeholder />;
  if (error) return <p>Error!</p>;

  const accountAddress = address;
  const daoName = 'MolochDAO';
  const timestamp = new Date().getTime();

  return data.proposals.map((proposal) => {
    const totalVoters = String(parseInt(Number(proposal.yesVotes) + Number(proposal.noVotes), 10));
    const yesPercentage = String(_getPercentage(Number(proposal.yesShares), Number(proposal.noShares)));
    const noPercentage = String(_getPercentage(Number(proposal.noShares), Number(proposal.yesShares)));
    const daoAddress = proposal.moloch.id;
    const status = (proposal.didPass) ? 'PASSED' : 'FAILED';
    const isPoll = (proposal.startingPeriod !== '0');
    const url = `/dao/${proposal.moloch.id}/proposal/${proposal.proposalIndex}`;

    return (
      <Post
        key={proposal.id} accountAddress={accountAddress} href={url}
        description={proposal.details} memberAddress={proposal.memberAddress}
        daoAddress={daoAddress}
      >
        <Contract>
          <Parameter label={i18n.t('moloch-applicant')}>
            <Account publicAddress={proposal.applicant} width="16px" height="16px" />
          </Parameter>
          <Parameter label={i18n.t('moloch-request')}>
            <Token quantity={String(proposal.sharesRequested)} symbol="SHARES" />
          </Parameter>
          <Parameter label={i18n.t('moloch-tribute')}>
            <Token quantity={proposal.tributeOffered} publicAddress={proposal.tributeToken} symbol={proposal.tributeTokenSymbol} decimals={proposal.tributeTokenDecimals} />
          </Parameter>
        </Contract>
        {(isPoll) ?
          <Poll>
            <Countdown
              now={timestamp}
              votingPeriodBegins={proposal.votingPeriodStarts} votingPeriodEnds={proposal.votingPeriodEnds}
              gracePeriodEnds={proposal.gracePeriodEnds} totalVoters={totalVoters}
            />
            <Survey>
              <Choice
                now={timestamp}
                accountAddress={accountAddress} daoName={daoName} publicAddress={proposal.moloch.id}
                proposalIndex={proposal.proposalIndex} label={i18n.t('yes')} percentage={yesPercentage}
                voteValue={defaults.YES} votingPeriodEnds={proposal.votingPeriodEnds} votingPeriodBegins={proposal.votingPeriodStarts}
              >
                <Token quantity={proposal.yesVotes} symbol="SHARES" />
              </Choice>
              <Choice
                now={timestamp}
                accountAddress={accountAddress} daoName={daoName} publicAddress={proposal.moloch.id}
                proposalIndex={proposal.proposalIndex} label={i18n.t('no')} percentage={noPercentage}
                voteValue={defaults.NO} votingPeriodEnds={proposal.votingPeriodEnds} votingPeriodBegins={proposal.votingPeriodStarts}
              >
                <Token quantity={proposal.noVotes} symbol="SHARES" />
              </Choice>
            </Survey>
            <Period
              now={timestamp}
              status={status} votingPeriodBegins={proposal.votingPeriodStarts}
              votingPeriodEnds={proposal.votingPeriodEnds} gracePeriodEnds={proposal.gracePeriodEnds}
            />
          </Poll>
          :
          null
        }
        <Social url={url} description={proposal.details}>
          <Stamp timestamp={proposal.createdAt} />
        </Social>
      </Post>
    );
  });
};

const Timeline = () => {
  return (
    <ApolloProvider client={client}>
      <Feed />
    </ApolloProvider>
  );
};


Timeline.propTypes = {};

Feed.propTypes = {};

export default Timeline;
