import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';

import { timers } from '/lib/const';
import { stripHTMLfromText } from '/imports/ui/modules/utils';
import { toggleSidebar } from '/imports/ui/modules/menu';

import './navigation.html';
import '../authentication/authentication.js';
import '../../widgets/notice/notice.js';

// Scroll behaviour
let lastScrollTop = 0;
let scrollDown = false;

function hideBar() {
  if (Meteor.Device.isPhone()) {
    $('.right').scroll(() => {
      const node = $('.navbar');
      const st = $('.right').scrollTop();
      if (st > lastScrollTop && st > 60) {
        scrollDown = true;
        node
          .velocity('stop')
          .velocity({ translateY: '0px' }, { duration: parseInt(timers.ANIMATION_DURATION, 10), easing: 'ease-out' })
          .velocity({ translateY: '-100px' }, {
            duration: parseInt(timers.ANIMATION_DURATION, 10),
            easing: 'ease-out',
            complete: () => {
              node.css('position', 'absolute');
              node.css('top', '0px');
            },
          })
          .velocity('stop');
      } else if (scrollDown === true) {
        scrollDown = false;
        node.css('position', 'fixed');
        node
          .velocity('stop')
          .velocity({ translateY: '-100px' }, { duration: parseInt(timers.ANIMATION_DURATION, 10), easing: 'ease-out' })
          .velocity({ translateY: '0px' }, {
            duration: parseInt(timers.ANIMATION_DURATION, 10),
            easing: 'ease-out',
            complete: () => {
            },
          })
          .velocity('stop');
      }
      lastScrollTop = st;
    });
  }
}

function displayMenuIcon() {
  if (Meteor.Device.isPhone()) {
    if (Router.current().url.search('/vote') >= 0) {
      return 'images/back.png';
    }
  }
  if (Session.get('sidebar')) {
    return 'images/burger-active.png';
  }
  return 'images/burger.png';
}

Template.navigation.onRendered(() => {
  hideBar();
});

Template.navigation.helpers({
  screen() {
    if (Session.get('navbar')) {
      document.title = stripHTMLfromText(`${TAPi18n.__('democracy-of')} ${Meteor.settings.public.Collective.name} - ${Session.get('navbar').title}`);
      return Session.get('navbar').title;
    }
    document.title = stripHTMLfromText(TAPi18n.__('democracy-earth'));
    return '';
  },
  icon() {
    if (Session.get('navbar') !== undefined) {
      return displayMenuIcon();
    }
    return 'images/burger.png';
  },
  link() {
    if (Session.get('navbar')) {
      return Session.get('navbar').href;
    }
    return '';
  },
  showNotice() {
    return Session.get('showNotice');
  },
});

Template.navigation.events({
  'click #menu'() {
    if (Session.get('navbar').action === 'SIDEBAR') {
      toggleSidebar();
    } else if (Session.get('navbar').action === 'BACK') {
      Session.set('newPostEditor', false);
      window.history.back();
    }
  },
});
