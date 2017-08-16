import { Session } from 'meteor/session';

import { getProfileFromUsername } from '../../startup/both/modules/User';

/*****
/* @param {string} text - string to format
******/
export const textFormat = (text) => {
  var html = new String();
  var bold = /\*(\S(.*?\S)?)\*/gm;

  if (text != undefined) {
    html = text.replace(bold, '<b>$1</b>');
    html = urlify(html);
    return html.replace(/\n/g, "<br />");
  }

}

let urlify = (text) => {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url.replace(/^https?:\/\//,'') + '</a>';
    })
}

let stripHTML = (html) => {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/******
* updates the dynamic tags from the description of a delegation
* @param {string} text - text to verify
* @param {boolean} isContract - if this is specific to a contract visualization context
* @return {string} checkedText - modified text
*****/
let _delegationTextCheck = (text, isContract) => {
  var checkedText = new String(text);
  var htmlTagOpen = new String ("<a href='#'");
  var htmlTagClose = new String ("</a>");
  var username = new Object();
  var profile = new Object();
  if (isContract) {
    switch (Session.get('contract').kind) {
      case 'DELEGATION':
        var signatures = Session.get('contract').signatures;
        if (signatures.length > 0) {
          for (i in signatures) {
            profile[signatures[i].role] = getProfileFromUsername(signatures[i].username);
            username[signatures[i].role] = signatures[i].username;
          }
        }
        if (profile != undefined) {
          checkedText = checkedText.replace('<delegator>', "<a href='/peer/" + username['DELEGATOR'] + "'>" + _getProfileName(profile['DELEGATOR']) + htmlTagClose);
          checkedText = checkedText.replace('<delegate>', "<a href='/peer/" + username['DELEGATE'] + "'>" + _getProfileName(profile['DELEGATE']) + htmlTagClose);
          if (Session.get('newVote') == undefined || Session.get('newVote').allocateQuantity == undefined || Session.get('rightToVote') == false) {
            checkedText = checkedText.replace('<votes>', Session.get('contract').wallet.balance); // Session.get('newVote').allocateQuantity);
          } else {
            checkedText = checkedText.replace('<votes>', Session.get('newVote').allocateQuantity);
          }

        }
        break;
    }
  } else {
    //TODO simple verification
  }
  return checkedText;
}


/******
* full name of a given user profile
* @param {object} profile - user profile
* @return {string} fullName - full name
*****/
let _getProfileName = (profile) => {
  fullName = new String();
  if (profile.firstName != undefined) {
    fullName = profile.firstName;
  }
  if (profile.lastName != undefined) {
    fullName += ' ' + profile.lastName;
  }
  return fullName;
};

export const logRenders = function logRenders(filter) {
  for (var name in Object(Template)){
    if (filter && !Array.isArray(filter)) filter = [filter];
    var template = Template[name];
    if (!template) continue;
    if (filter && filter.indexOf(name) == -1){
      // Clear previous logRenders
      if ('oldRender' in template) template.rendered = template.oldRender;
      delete template.oldRender;
      continue;
    }
    var t = function (name, template){
      if (!('oldRender' in template)) template.oldRender = template.rendered;
      var counter = 0;
      template.rendered = function () {
        console.log(name, ++counter, this);
        this.oldRender && this.oldRender.apply(this, arguments);
      };
    }(name, template);
  }
};

export const getProfileName = _getProfileName;
export const delegationTextCheck = _delegationTextCheck;
export const stripHTMLfromText = stripHTML;
