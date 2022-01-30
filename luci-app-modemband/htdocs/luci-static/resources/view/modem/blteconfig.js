'use strict';
'require form';
'require fs';
'require view';
'require ui';
'require uci';
'require poll';
'require tools.widgets as widgets';

/*
	Copyright 2022 Rafał Wabik - IceG - From eko.one.pl forum
*/

function handleAction(ev) {
	if (ev === 'setbandz') {

	L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null')
	.then(function(res) {
		if (res) {
		var mArray = [];
		var mArray = res.trim().split('\n');

		var nb = L.toArray(uci.get('modemband', '@modemband[0]', 'set_bands')).join(',');
		nb = nb.replace(/,/g, ' ')

		fs.exec_direct('/usr/bin/modemband.sh', [ 'setbands', nb ]);
		
		ui.addNotification(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible please restart the modem.') ), 'info');

		}
	});

	}
}


return view.extend({
	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null')
	},

	render: function(mData) {
		var m, s, o;

		pollData: poll.add(function() {
			return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null').then(function(res) {
		var mArray = [];
		var mArray = res.trim().split('\n');

		if (document.getElementById('modemlteb')) {
			var modemb = mArray[2];
			modemb = modemb.replace("LTE bands: ", "");
			var view = document.getElementById("modemlteb");
			view.textContent = modemb;
		}

			});
		});

		var mArray = [];
		var mArray = mData.trim().split('\n');

		var modem = mArray[0];
		modem = modem.replace("Modem: ", "");

		var ltebands = mArray[2];
		ltebands = ltebands.replace("LTE bands: ", "");

		var sbands = mArray[1];
		sbands = sbands.replace("Supported LTE bands: ", "");

		var info = _('Configuration modem frequency bands. More information about the modemband application on the') + ' <a href="https://eko.one.pl/?p=openwrt-modemband" target="_blank">' + _('eko.one.pl forum') + '</a>.';

		m = new form.Map('modemband', _('Configure modem bands'), info);

		s = m.section(form.TypedSection, 'modemband', '', _(''));
		s.anonymous = true;

		s.render = L.bind(function(view, section_id) {
			return E('div', { 'class': 'cbi-section' }, [
				E('h3', _('Modem information')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '33%' }, [ _('Modem:')]),
						E('div', { 'class': 'td left' }, [ modem || '-' ]),
					]),

						E('tr', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '33%' }, [ _('LTE bands:')]),
						E('div', { 'class': 'td left', 'id': 'modemlteb' }, [ ltebands || '-' ]),
					]),

						E('tr', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '33%' }, [ _('Supported LTE bands:')]),
						E('div', { 'class': 'td left' }, [ sbands || '-' ]),
					]),

				]),
					E('div', { class: 'right' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-apply',
						'id': 'magicbtn',
						'click': ui.createHandlerFn(this, function() {
							return handleAction('setbandz');
						})
					}, [ _('Apply changes to bands') ]),
					
				])

			]);
		}, o, this);

		s = m.section(form.TypedSection, 'modemband', _(''));
		s.anonymous = true;
		s.addremove = false;

		s.tab('bandset', _('Preferred bands settings'));
 
		o = s.taboption('bandset', form.MultiValue, 'set_bands', _('Currently selected bands:'),
		_('Select the preferred band(s) for the modem.'));

		const words = sbands.split(' ');
		for (var i = 0; i < words.length; i++) 
		{
			o.value(words[i], _('B')+words[i],_(''));
		}

		o.multiple = true;
		o.select_placeholder = _('none');
		o.placeholder = _('Please select a band');
		o.cfgvalue = function(section_id) {
			return L.toArray(uci.get('modemband', section_id, 'set_bands')).join(',').split(/[ \t,]+/);
		};
		o.remove = function(section_id) {
			uci.set('modemband', section_id, 'set_bands', [ 'none' ]);
		};
		o.write = function(section_id, value) {
    			m.data.set('modemband', section_id, 'set_bands', L.toArray(value).join(','));
		};


		return m.render();
	}
});
