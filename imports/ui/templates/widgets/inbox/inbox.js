import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';

import { toggleSelectedItem } from '../../../modules/menu';

import './inbox.html';

Template.inbox.helpers({
  selected() {
    if (this.url) {
      const current = Router.current().url.replace(window.location.origin, '');
      if ((Router.current().params.username === this.url.substring(6))
        || (current === this.url)
      ) {
        return 'menu-item-selected';
      }
    }
    return '';
  },
  isAvatar() {
    return this.isAvatar;
  },
});

Template.inbox.events({
  'click #menuButton'() {
    Session.set('sidebarMenuSelectedId', this.id);
    if (typeof this.id === 'string') {
      toggleSelectedItem(Session.get('menuDelegates'));
    } else {
      toggleSelectedItem(Session.get('menuDecisions'));
    }
  },
});
