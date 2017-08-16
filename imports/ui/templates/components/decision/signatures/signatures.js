import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';

import { getAnonymous } from '/imports/startup/both/modules/User';
import { signContract } from '/imports/startup/both/modules/Contract';
import { displayModal } from '/imports/ui/modules/modal';

import './signatures.html';
import '../../identity/avatar/avatar.js';

Template.signatures.onRendered(() => {
  if (!Session.get('contract')) { return; }
  const signers = Session.get('contract').signatures;
  if (signers && Meteor.user()) {
    for (const i in signers) {
      if (signers[i]._id === Meteor.userId()) {
        Session.set('userSigned', true);
        break;
      } else {
        Session.set('userSigned', false);
      }
    }
  }
  Session.set('displaySignaturePopup', false);
});

Template.signatures.helpers({
  userSigned() {
    return Session.get('userSigned');
  },
  signer() {
    if (Session.get('contract')) {
      const signerIds = [];
      if (Session.get('contract').signatures !== undefined) {
        for (const i in Session.get('contract').signatures) {
          signerIds.push(Session.get('contract').signatures[i]._id);
        }
        return signerIds;
      }
      // is anonymous
      if (!this.editorMode) {
        return [getAnonymous(true)];
      }
    }
    return undefined;
  },
  timestamp() {
    if (Session.get('contract')) {
      let d = Date();
      if (Session.get('contract').timestamp !== undefined) {
        d = Session.get('contract').timestamp;
        return d.format('{Month} {d}, {yyyy}');
      }
    }
    return '';
  },
});

Template.signatures.events({
  'click #sign-author, click #sign-author-link'() {
    displayModal(
      true,
      {
        icon: 'images/author-signature.png',
        title: TAPi18n.__('proposal-author'),
        message: TAPi18n.__('proposal-signed-identity'),
        cancel: TAPi18n.__('not-now'),
        action: TAPi18n.__('sign'),
        displayProfile: true,
        profileId: Meteor.user()._id,
      },
      () => {
        Session.set('userSigned', true);
        signContract(Session.get('contract')._id, Meteor.user(), 'AUTHOR');
        if ($('#titleContent').length > 0) {
          $('#titleContent').focus();
        }
      }
    );
  },
});
