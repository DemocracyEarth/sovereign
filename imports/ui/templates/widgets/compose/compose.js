import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { createContract } from '/imports/startup/both/modules/Contract';
import { animationSettings } from '/imports/ui/modules/animation';
import './compose.html';


const animationIntro = () => {
  $('.action-icon-mouseleave').velocity({ opacity: 0 }, animationSettings);
  $('.action-icon-mouseover').velocity({ opacity: 1 }, animationSettings);
  $('.action-label').velocity({ opacity: 1, 'margin-left': '-135px', width: '120px' }, animationSettings);
};

const animationExit = () => {
  $('.action-icon-mouseleave').velocity({ opacity: 1 }, animationSettings);
  $('.action-icon-mouseover').velocity({ opacity: 0 }, animationSettings);
  $('.action-label').velocity({ opacity: 0, 'margin-left': -115, width: '0px' }, animationSettings);
};

Template.compose.onRendered(() => {
  $('.action-label').css('opacity', 0);
  $('.action-label').css('overflow', 'hidden');
  $('.action-icon-mouseover').css('opacity', 0);
});

Template.compose.helpers({
  mouseActive() {
    return Session.get('showCompose');
  },
  proposalDrafting() {
    if (Meteor.settings.public.app.config.proposalDrafting === false) {
      return false;
    }
    return true;
  },
});

Template.compose.events({
  'mouseover #action-hotspace'() {
    Session.set('showCompose', true);
    animationIntro();
  },
  'mouseleave #action-hotspace'() {
    Session.set('showCompose', false);
    animationExit();
  },
  'click #action-hotspace'() {
    createContract();
  },
});
