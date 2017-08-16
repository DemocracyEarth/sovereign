import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { gui } from '/lib/const';

import { showFullName } from '/imports/startup/both/modules/utils';
import { Contracts } from '/imports/api/contracts/Contracts';
import { Transactions } from '/imports/api/transactions/Transactions';

import { animationSettings } from './animation';

/**
/* @summary for a specific section returns how many new items to signal as new in sidebar
/* @param {string} feed - feed name from url query
******/
const _getSectionValue = (feed) => {
  if (Meteor.user() !== null) {
    const menu = Meteor.user().profile.menu;
    if (menu !== undefined && menu.length > 0) {
      for (const item in menu) {
        if (menu[item].feed === feed) {
          return menu[item].newItems;
        }
      }
    }
  }
  return 0;
};

/**
/* @summary verifies selected object based on query param
/* @param {string} selection - item selected
/* @param {object} feed - feed to compare with
*/
const _verifySelection = (selection, feed) => {
  if (selection === feed) {
    // empty content if void
    Session.set('emptyContent', {
      label: TAPi18n.__(`empty-feed-label-${feed}`),
      detail: TAPi18n.__(`empty-feed-detail-${feed}`),
      contribute: TAPi18n.__(`empty-feed-contribute-${feed}`),
      url: `/vote/draft?kind=${feed}`,
    });

    if (typeof Session.get('sidebarMenuSelectedId') !== 'string') {
      return true;
    }
  }
  return false;
};

/**
/* stores the current selected item in case of refresh
/* @param {array} arrMenu - arry items from menu
******/
const _toggleSelectedItem = (arrMenu) => {
  const menu = arrMenu;
  if (Session.get('sidebarMenuSelectedId')) {
    for (const item in menu) {
      if (menu[item].id === Session.get('sidebarMenuSelectedId')) {
        menu[item].selected = true;
      } else {
        menu[item].selected = false;
      }
    }
    return menu;
  }
  return false;
};

/**
/* @summary constructs object for decisions menu (aka main)
/* @param {string} feed - feed name from url query
*/
const _getDecisionsMenu = (feed) => {
  const menu = [];
  let username = String();

  if (Meteor.user() !== null) {
    username = Meteor.user().username;
  } else {
    username = 'anonymous';
    // TODO verify that for unlogged users I get anon proposals on feed
  }

  menu.push(
    {
      id: 0,
      label: TAPi18n.__('live-votes'),
      icon: 'images/decision-open.png',
      iconActivated: 'images/decision-open-active.png',
      feed: 'live-votes',
      value: _getSectionValue('live-votes'),
      separator: false,
      url: '/feed?stage=live&kind=vote&executionstatus=open',
      selected: _verifySelection('live-votes', feed),
    },
    {
      id: 1,
      label: TAPi18n.__('live-votes-peer'),
      icon: 'images/decision-vote.png',
      iconActivated: 'images/decision-vote-active.png',
      feed: 'live-votes-peer',
      value: _getSectionValue('live-votes-peer'),
      separator: false,
      url: `/feed?stage=live&kind=vote&peer=${username}`,
      selected: _verifySelection('live-votes-peer', feed),
    },
    {
      id: 2,
      label: TAPi18n.__('votes-finish-approved'),
      icon: 'images/decision-approved.png',
      iconActivated: 'images/decision-approved-active.png',
      feed: 'votes-finish-approved',
      value: _getSectionValue('votes-finish-approved'),
      separator: false,
      url: '/feed?stage=finish&kind=vote&executionstatus=approved',
      selected: _verifySelection('votes-finish-approved', feed),
    },
    {
      id: 3,
      label: TAPi18n.__('vote-drafts'),
      icon: 'images/decision-draft.png',
      iconActivated: 'images/decision-draft-active.png',
      feed: 'vote-drafts',
      value: _getSectionValue('vote-drafts'),
      separator: false,
      url: '/feed?stage=draft&kind=vote',
      selected: _verifySelection('vote-drafts', feed),
    },
    {
      id: 4,
      label: TAPi18n.__('votes-finish-rejected'),
      icon: 'images/decision-rejected.png',
      iconActivated: 'images/decision-rejected-active.png',
      feed: 'votes-finish-rejected',
      value: _getSectionValue('votes-finish-rejected'),
      separator: false,
      url: '/feed?stage=finish&kind=vote&executionstatus=rejected',
      selected: _verifySelection('votes-finish-rejected', feed),
    }
  );

  if (Meteor.user() === null || Meteor.settings.public.app.config.proposalDrafting === false) {
    // delete options for unlogged users TODO: improve this in a reasonable way.
    menu.splice(1, 1);
    menu.splice(2, 1);
  }

  _toggleSelectedItem(menu);
  Session.set('menuDecisions', menu);
  return menu;
};

/**
/* @summary checks if item already present in array
/* @param {string} id - id to search in array
/* @param {string} array - item list
*/
const _alreadyListed = (id, array) => {
  if (id === Meteor.user()._id) { return true; }
  for (const i in array) {
    if (array.length > 0) {
      if (array[i] === id) {
        return true;
      }
    }
  }
  return false;
};

/**
/* @summary searches inside a contract
*/
const _searchContract = (source, list) => {
  switch (source.kind) {
    case 'DELEGATION':
      for (const stamp in source.signatures) {
        const delegate = source.signatures[stamp]._id;
        if (!_alreadyListed(delegate, list)) {
          list.push(delegate);
        }
      }
      break;
    default:
      break;
  }
  return list;
};

/**
/* @summary gets a list of users given an array
*/
const getUserList = (array) => {
  const userList = [];
  let user = '';

  for (const i in array) {
    user = Meteor.users.findOne({ _id: array[i] });
    let labelUser;
    if (user !== undefined) {
      if (user.profile && user.profile.firstName && user.profile.lastName) {
        labelUser = showFullName(user.profile.firstName, user.profile.lastName);
      } else {
        labelUser = user.username;
      }
      userList.push({
        id: user._id,
        label: labelUser,
        icon: user.profile.picture,
        iconActivated: false,
        feed: 'user',
        value: true,
        separator: false,
        url: `/peer/${user.username}`,
        selected: false,
      });
    } else {
      return false;
    }
  }
  return userList;
};

/**
/* @summary constructs object for delegates menu (aka chat)
*/
const _getDelegatesMenu = () => {
  let users = [];
  let delegations = [];
  const transactions = _.filter(Transactions.find({ kind: 'DELEGATION' }).fetch(),
    (item) => { return (item.input.entityId === Meteor.userId() || item.output.entityId === Meteor.userId()); }, 0);

  if (transactions.length > 0) {
    delegations = _.uniq(_.pluck(transactions, 'contractId'));
    for (const i in delegations) {
      const source = Contracts.findOne({ _id: delegations[i] });
      if (source !== undefined) {
        users = _searchContract(source, users);
      }
    }
  }

  // search contracts
  const contracts = Contracts.find({
    collectiveId: Meteor.settings.public.Collective._id,
    signatures: { $elemMatch: { username: Meteor.user().username } },
  }).fetch();

  for (const i in contracts) {
    users = _searchContract(contracts[i], users);
  }

  // get delegators to me
  const list = getUserList(users);
  _toggleSelectedItem(list);
  Session.set('menuDelegates', list);
};

/**
/* @summary builds the menu for the sidebar
/* @param {string} feed - option selected from url query.
*/
const sidebarMenu = (feed) => {
  _getDecisionsMenu(feed);

  // specific to user
  if (Meteor.user() !== null) {
    _getDelegatesMenu(feed);
  } else {
    Session.set('menuDelegates', undefined);
  }
};

/**
/* constructs object for personal menu (custom for user)
/* NOTE: Momentairily depreacted.
/* @param {string} feed - feed name from url query
*/
const _getPersonalMenu = (feed) => {
  const menu = [];

  menu.push(
    {
      id: 6,
      label: TAPi18n.__('proposals'),
      icon: 'images/decision-proposals.png',
      iconActivated: 'images/decision-proposals-active.png',
      feed: 'proposals',
      value: Meteor.user().profile.menu.drafts,
      separator: false,
      url: '/filter?kind=vote&id=',
      selected: _verifySelection('proposals', feed),
    },
    {
      id: 7,
      label: TAPi18n.__('voted-issues'),
      icon: 'images/decision-vote.png',
      iconActivated: 'images/decision-vote-active.png',
      feed: 'voted',
      value: Meteor.user().profile.menu.drafts,
      separator: false,
      url: '/filter?kind=vote&id=',
      selected: _verifySelection('voted', feed),
    }
  );

  return menu;
};

/**
/* @summary animation for main menu toggle activation burger button
*/
const animateMenu = () => {
  // TODO make all strings showing pixels compliant with the device screen being used (aka mobiles)
  const splitLeft = $('.split-left').width();
  let diff = 0;
  Session.set('sidebar', !Session.get('sidebar'));
  if (Session.get('sidebar')) {
    // show sidebar
    diff = parseInt(parseInt(splitLeft - gui.SIDEBAR_WIDTH, 10) - parseInt(($('.right').width() / 2), 10), 10);
    let splitLeftNewWidth = parseInt(splitLeft - gui.SIDEBAR_WIDTH, 10);
    let splitRightNewMargin = parseInt(diff + (gui.SIDEBAR_WIDTH / 2), 10);
    let splitRightNewWidth = $('.split-right').width();
    let splitLeftNewMargin = $('.split-left').css('marginLeft');
    let newRight = 0;

    if ($(window).width() < gui.MOBILE_MAX_WIDTH) {
      newRight = parseInt(0 - gui.SIDEBAR_WIDTH, 10);
    }

    // loose mobile menu
    if (Meteor.Device.isPhone()) {
      $('.mobile-menu').css('margin-top', '-55px');
      $('.mobile-menu').css('position', 'absolute');
      $('.mobile-menu').css('top', `${$('#content').scrollTop() + $(window).height()}px`);
      $('.navbar').css('position', 'absolute');
      $('.navbar').css('top', `${$('#content').scrollTop()}px`);
      $('.inhibitor').css('display', 'block');
      $('.inhibitor').css('position', 'fixed');
      $('.inhibitor').css('left', `${gui.SIDEBAR_WIDTH}px`);
      $('.content').css('overflow', 'hidden');
    }

    // animate content
    $('#menu').velocity({ marginLeft: '0px' }, animationSettings);
    $('#content').velocity({
      left: gui.SIDEBAR_WIDTH,
      right: newRight,
    }, animationSettings);

    // animate splits
    if (splitLeftNewWidth < gui.MIN_CONTRACT_WIDTH) {
      splitRightNewMargin -= parseInt(splitLeftNewWidth - gui.MIN_CONTRACT_WIDTH, 10);
      splitLeftNewWidth = gui.MIN_CONTRACT_WIDTH;
      splitRightNewWidth = parseInt($(window).width() - (gui.SIDEBAR_WIDTH + splitLeftNewWidth), 10);
    }

    if ($(window).width() < gui.DESKTOP_MIN_WIDTH) {
      splitLeftNewWidth = '100%';
      splitRightNewWidth = '100%';
      splitRightNewMargin = '0px';
      splitLeftNewMargin = '0px';
    }
    $('.split-right').velocity({
      marginLeft: splitRightNewMargin,
      width: splitRightNewWidth,
    }, animationSettings);
    $('.split-left').velocity({
      marginLeft: splitLeftNewMargin,
      width: splitLeftNewWidth,
    }, animationSettings);
  } else {
    // hide sidebar
    if ($(window).width() >= gui.DESKTOP_MIN_WIDTH) {
      diff = parseInt((splitLeft + gui.SIDEBAR_WIDTH)
             - parseInt(($(window).width() / 2), 10), 10);
    }

    $('#menu').velocity({ marginLeft: parseInt(0 - gui.SIDEBAR_WIDTH, 10) }, animationSettings);
    $('#content').velocity({
      left: 0,
      right: 0,
    }, {
      duration: animationSettings.duration,
      complete: () => {
        if (Meteor.Device.isPhone()) {
          $('.mobile-menu').css('margin-top', '0px');
          $('.mobile-menu').css('position', 'fixed');
          $('.mobile-menu').css('top', '');
          $('.mobile-menu').css('bottom', '0px');
          $('.navbar').css('position', 'fixed');
          $('.navbar').css('top', '0px');
          $('.inhibitor').css('display', 'none');
          $('.content').css('overflow', 'scroll');
        }
      },
    });
    $('.split-right').velocity({
      marginLeft: diff,
    }, animationSettings);

    if ($(window).width() >= gui.DESKTOP_MIN_WIDTH) {
      $('.split-left').velocity({ width: parseInt(splitLeft + gui.SIDEBAR_WIDTH, 10) }, animationSettings);
    } else {
      $('.split-left').velocity({ width: '100%' }, animationSettings);
    }
  }
};

export const toggleSelectedItem = _toggleSelectedItem;
export const toggleSidebar = animateMenu;
export const setSidebarMenu = sidebarMenu;
