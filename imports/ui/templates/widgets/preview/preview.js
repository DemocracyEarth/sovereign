import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
// import { $ } from 'meteor/jquery';

import { stripHTMLfromText } from '/imports/ui/modules/utils';
import { Contracts } from '/imports/api/contracts/Contracts';

import '/imports/ui/templates/widgets/preview/preview.html';

/* const _getCharLength = (id) => {
  const DEFAULT = 30;
  const width = $(`#transactionItem-${id}`).width;
  if (width) {
    const chars = parseInt((width * DEFAULT) / 600, 10);
    console.log(chars);
    return chars;
  }
  return DEFAULT;
};*/

Template.preview.onCreated(function () {
  Template.instance().feed = new ReactiveVar();
  Template.instance().contract = new ReactiveVar();

  const instance = this;
  const _id = Template.currentData().contractId;
  if (_id) {
    const contract = Contracts.findOne({ _id });
    if (!contract) {
      Meteor.call('getContractById', Template.currentData().contractId, function (error, result) {
        if (result) {
          instance.contract.set(result);
        } else if (error) {
          console.log(error); // eslint-disable-line no-console
        }
      });
    } else {
      instance.contract.set(contract);
    }
  }
});

Template.preview.helpers({
  ready() {
    return (Template.instance().contract.get() !== undefined);
  },
  displayTitle() {
    const contract = Template.instance().contract.get();
    const title = stripHTMLfromText(contract.title);
    let chars = 21; // _getCharLength(contract._id);
    if (Meteor.Device.isPhone()) {
      chars = 15;
    }
    if (title.length > chars) {
      return `${title.substring(0, chars)}&mldr;`;
    }
    return title;
  },
  fullTitle() {
    return stripHTMLfromText(Template.instance().contract.get().title);
  },
  url() {
    return Template.instance().contract.get().url;
  },
});
