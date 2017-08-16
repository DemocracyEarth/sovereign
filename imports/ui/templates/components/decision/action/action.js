import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';

import { sendDelegationVotes, publishContract } from '/imports/startup/both/modules/Contract';
import { displayModal } from '/imports/ui/modules/modal';
import { ballotReady } from '/imports/ui/modules/ballot';

import './action.html';

function disableContractExecution() {
  if (Session.get('emptyBallot') && Session.get('contract').ballotEnabled) {
    return true;
  } else if (Session.get('unauthorizedFork') && Session.get('contract').ballotEnabled) {
    return true;
  } else if (Session.get('missingTitle')) {
    return true;
  } else if (Session.get('mistypedTitle')) {
    return true;
  } else if (Session.get('duplicateURL')) {
    return true;
  } else if (Session.get('noVotes')) {
    return true;
  } else if (Session.get('draftOptions') && Session.get('contract').ballotEnabled) {
    return true;
  } else if (!Session.get('rightToVote')) {
    return true;
  }
  if (Session.get('contract').kind === 'VOTE' && Session.get('contract').stage === 'LIVE') {
    if (!ballotReady()) {
      return true;
    }
  }
  if (Session.get('newVote') !== undefined) {
    if (Session.get('newVote').mode === 'PENDING' || Session.get('newVote').mode === undefined) {
      return false;
    }
    return true;
  }
  return false;
}

Template.action.helpers({
  disabled() {
    if (disableContractExecution()) {
      return 'disabled';
    }
    if (Session.get('newVote') !== undefined) {
      switch (Session.get('newVote').mode) {
        case 'EXECUTED':
          return 'executed';
        default:
          return '';
      }
    } else {
      return '';
    }
  },
});

Template.action.events({
  'click .action-button'() {
    // get all info from current draft
    if (this.enabled) {
      if (disableContractExecution() === false) {
        switch (Session.get('contract').kind) {
          case 'DELEGATION':
            let counterPartyId;
            for (const stamp in Session.get('contract').signatures) {
              if (Session.get('contract').signatures[stamp]._id !== Meteor.user()._id) {
                counterPartyId = Session.get('contract').signatures[stamp]._id;
              }
            }
            displayModal(
              true,
              {
                icon: 'images/modal-delegation.png',
                title: TAPi18n.__('send-delegation-votes'),
                message: TAPi18n.__('delegate-votes-warning').replace('<quantity>', Session.get('newVote').allocateQuantity),
                cancel: TAPi18n.__('not-now'),
                action: TAPi18n.__('delegate-votes'),
                displayProfile: true,
                profileId: counterPartyId,
              },
              () => {
                const settings = {
                  condition: {
                    transferable: Session.get('contract').transferable,
                    portable: Session.get('contract').portable,
                    tags: Session.get('contract').tags,
                  },
                  currency: 'VOTES',
                  kind: Session.get('contract').kind,
                  contractId: Session.get('contract')._id,
                };
                sendDelegationVotes(Session.get('contract').signatures[0]._id, Session.get('contract')._id, Session.get('newVote').allocateQuantity, settings);
              }
            );
            break;
          default: // case 'VOTE':
            if (Session.get('contract').stage === 'DRAFT') {
              displayModal(
                true,
                {
                  icon: 'images/modal-ballot.png',
                  title: TAPi18n.__('launch-vote-proposal'),
                  message: TAPi18n.__('publish-proposal-warning'),
                  cancel: TAPi18n.__('not-now'),
                  action: TAPi18n.__('publish-proposal'),
                  displayProfile: false,
                },
                () => {
                  publishContract(Session.get('contract')._id);
                }
              );
            } /*else if (Session.get('contract').stage === 'LIVE') {
              displayModal(
                true,
                {
                  icon: 'images/modal-vote.png',
                  title: TAPi18n.__('place-vote'),
                  message: TAPi18n.__('place-votes-warning').replace('<quantity>', Session.get('newVote').allocateQuantity),
                  cancel: TAPi18n.__('not-now'),
                  action: TAPi18n.__('vote'),
                  displayProfile: false,
                },
                () => {
                  const ballot = purgeBallot(Session.get('candidateBallot'));
                  const settings = {
                    condition: {
                      tags: Session.get('contract').tags,
                      ballot,
                    },
                    currency: 'VOTES',
                    kind: Session.get('contract').kind,
                    contractId: Session.get('contract')._id,
                  };
                  vote(Meteor.user()._id, Session.get('contract')._id, Session.get('newVote').allocateQuantity, settings);
                }
              );
            }*/
            break;
        }
      }
    }
  },
});
