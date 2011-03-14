// ==UserScript==
// @include http://*
// @include https://*
// ==/UserScript==

window == window.top && (currentUrl = document.location.href) && (function(window, loc, document, opera, extension) {
//  alert([window.top, window.parent, window.self, window == this.top,this.top,this.parent])
//  if ( window != top) { return; }
//  opera.postError('in here');  
  var
    ACTION_CAPTURE_SELECTION = 'capture_selection'
    ,ACTION_SEND_PAGE = 'send_to_phone'
    ,ACTION_CLOSE_TAB = 'close_tab'
    ,forEach = Array.forEach || (function(fe) {
      return function(array, fn, that) {
        fe.call(array, fn, that);
      };
    })([].forEach)
    ,validURI = /^(?:https?|market|tel|sms(?:to)?|mailto|ftp):/i
    ,phoneURI = /^(?:market|tel|sms(?:to)?):|^http:\/\/chart\.apis\.google\.com\/chart\?.*?&?chl=([^&]+)/i
    ,currentUrl = document.location.href
  ;
  
  opera.extension.addEventListener( 'message', function( message ) {
    if( message.data.action === ACTION_CAPTURE_SELECTION ) {
      var pageInfo = {
        action: ACTION_SEND_PAGE,
        data: {
          link: currentUrl,
          title: document.title,
          selection: document.getSelection() && document.getSelection().toString() || null
        }
      };
      // URL overrides
      if ( currentUrl.match( /^http[s]?:\/\/maps\.google\./i ) ||
          currentUrl.match( /^http[s]?:\/\/www\.google\.[a-z]{2,3}(\.[a-z]{2})\/maps/i ) ) {
        var link = document.getElementById('link');
        if (link && link.href)
          pageInfo.data.link = link.href;
      }
      opera.extension.postMessage( pageInfo );
    }
  }, false);
  
  function findAndReplace(searchText, replacement, parent) {
      if (!searchText || typeof replacement === 'undefined') {
          // Throw error here if you want...
          return;
      }
      var regex = typeof searchText === 'string'
        ? new RegExp(searchText, 'g')
        : searchText
      ;
      forEach((parent || document.body).selectNodes('//text()[contains(., "' + searchText + '")]'), function(node) {
        node.data.replace(regex, replacement);
      });
  }
  addEventListener( 'DOMContentLoaded', function() {
    if(/^https?:\/\/www\.google\.com\/accounts\/ServiceLogin\?(.*)?ahname=Chrome\+to\+Phone(.*)?$/i.test(currentUrl)) {
      // Opera log in message so users know what they are logging in to.
      findAndReplace('Chrome', 'Opera', document.body); 
    } else if (/^http:\/\/code\.google\.com\/p\/chrometophone\/logo(.*)?$/i.test(currentUrl)) {
      opera.extension.postMessage({
        action: ACTION_CLOSE_TAB
      });
    }
  }, false);
  document.addEventListener('click'
    ,function(e, link) {
      if (!(link = e.target.selectSingleNode('ancestor-or-self::a')) || !phoneURI.test(link.href)) { return; }
      // todo: show some indication that the information has been sent to the phone instead
      e.preventDefault();
      var
        match = link.href.match(phoneURI)
        ,info = {
          action: ACTION_SEND_PAGE
          ,data: {
            link: match && match[1] || link.href
            ,title: link.innerText || link.getAttribute('title') || document.title
            ,selection: document.getSelection() && document.getSelection().toString() || null
          }
        }
      ;
      opera.postError('chrome2phone - SENDING!\n' + JSON.stringify(info));
      opera.extension.postMessage(info);
    }
    ,false
  );
})(this, this.location, this.document, this.opera, this.opera.extension);