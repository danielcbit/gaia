/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

window.addEventListener('localized', function getCarrierSettings(evt) {
  var DEBUG = false;

  // display data carrier name
  // TODO: set an event listener if mozMobileConnection isn't ready yet
  var dataConnection = navigator.mozMobileConnection.data;
  document.getElementById('data-desc').textContent = dataConnection ?
      dataConnection.network.shortName : '?';

  // query <apn> elements matching the mcc/mnc arguments
  function queryAPN(apnDocument, mcc, mnc) {
    var query = '//gsm[network-id[@mcc=' + mcc + '][@mnc=' + mnc + ']]/apn';
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(apnDocument);
    var result = xpe.evaluate(query, apnDocument, nsResolver, 0, null);

    var found = [];
    var res = result.iterateNext();
    while (res) { // turn each resulting XML element into a JS object
      var apn = {
        id: res.getAttribute('value'),
        name: '',
        plan: '',
        usage: '',
        username: '',
        password: '',
        dns: []
      };
      var node = res.firstElementChild;
      while (node) {
        if (node.tagName == 'dns') {
          apn.dns.push(node.textContent);
        } else {
          apn[node.tagName] = node.textContent || node.getAttribute('type');
        }
        node = node.nextElementSibling;
      }
      found.push(apn);
      res = result.iterateNext();
    }

    return found;
  }

  // create a button to apply <apn> data to the current fields
  function createAPNButton(item) {
    function setFieldValue(name, value) {
      var selector = 'input[data-setting="ril.data.' + name + '"]';
      document.querySelector(selector).value = value || '';
    }

    var button = document.createElement('input');
    button.type = 'button';
    button.value = item.name;
    button.onclick = function fillAPNData() {
      setFieldValue('apn', item.id);
      setFieldValue('user', item.username);
      setFieldValue('passwd', item.password);
    };

    return button;
  }

  // update APN fields
  function autoAPN() {
    var APN_FILE = 'serviceproviders.xml';

    if (navigator.mozMobileConnection &&
        navigator.mozMobileConnection.data &&
        navigator.mozMobileConnection.data.network) { // get MCC/MNC values
      var dataNetwork = navigator.mozMobileConnection.data.network;
      var mcc = dataNetwork.mcc;
      var mnc = dataNetwork.mnc;
    } else {
      return;
    }

    var apnList = document.getElementById('autoAPN-list');
    apnList.innerHTML = '';
    if (DEBUG) { // display MCC/MNC in the UI
      apnList.innerHTML += 'mcc: ' + mcc + ' / mnc: ' + mnc + '<br />';
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', APN_FILE, false); // synchronous (boo!)
    xhr.send();

    var results = queryAPN(xhr.responseXML, mcc, mnc);
    for (var i = 0; i < results.length; i++) {
      var button = createAPNButton(results[i]);
      apnList.appendChild(button);
      if (i == 0) // always apply the data in the first <apn> element
        button.click();
    }
  };

  document.getElementById('autoAPN').onclick = autoAPN;
});

