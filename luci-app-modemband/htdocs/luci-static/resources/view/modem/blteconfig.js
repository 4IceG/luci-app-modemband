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

var BANDmagic = form.DummyValue.extend({

	load: function() {
		var setupButton = E('button', {
				'class': 'btn cbi-button cbi-button-apply',
				'click': ui.createHandlerFn(this, function() {
							return handleAction('setbandz');
						}),
			}, _('Apply changes'));

		var restoreButton = E('button', {
				'class': 'cbi-button cbi-button-reset',
				'click': ui.createHandlerFn(this, function() {
							return handleAction('resetbandz');
						}),

			}, _('Restore'));

		return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null').then(L.bind(function(html) {
				if (html == null) {
					this.default = E('em', {}, [ _('The modemband error.') ]);
				}
				else {
					this.default = E([
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' },
							_('Bands configuration')
						),
						E('div', { 'class': 'cbi-value-field', 'style': 'width:25vw' },
								E('div', { 'class': 'cbi-section-node' }, [
									setupButton,
								]),
						),
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' },
							_('Restore default bands')
						),
						E('div', { 'class': 'cbi-value-field', 'style': 'width:25vw' },
								E('div', { 'class': 'cbi-section-node' }, [
									restoreButton,
								]),
						),
					]),

				]);
					}
			}, this));
	}
});

var cbiRichListValue = form.ListValue.extend({
	renderWidget: function(section_id, option_index, cfgvalue) {
		var choices = this.transformChoices();
		var widget = new ui.Dropdown((cfgvalue != null) ? cfgvalue : this.default, choices, {
			id: this.cbid(section_id),
			sort: this.keylist,
			optional: true,
			select_placeholder: this.select_placeholder || this.placeholder,
			custom_placeholder: this.custom_placeholder || this.placeholder,
			validate: L.bind(this.validate, this, section_id),
			disabled: (this.readonly != null) ? this.readonly : this.map.readonly
		});

		return widget.render();
	},

	value: function(value, title, description) {
		if (description) {
			form.ListValue.prototype.value.call(this, value, E([], [
				E('span', { 'class': 'hide-open' }, [ title ]),
				E('div', { 'class': 'hide-close', 'style': 'min-width:25vw' }, [
					E('strong', [ title ]),
					E('br'),
					E('span', { 'style': 'white-space:normal' }, description)
				])
			]));
		}
		else {
			form.ListValue.prototype.value.call(this, value, title);
		}
	}
});

function handleAction(ev) {
	if (ev === 'setbandz') {
		var nb = L.toArray(uci.get('modemband', '@modemband[0]', 'set_bands')).join(',');
		nb = nb.replace(/,/g, ' ')
		fs.exec_direct('/usr/bin/modemband.sh', [ 'setbands', nb ]);
		ui.addNotification(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible please restart the modem.') ), 'info');

		}
	if (ev === 'resetbandz') {		
		if (confirm(_('Do you really want to set up all possible bands for the modem?')))
			{
			fs.exec_direct('/usr/bin/modemband.sh', [ 'setbands', 'default' ]);
			ui.addNotification(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible please restart the modem.')), 'info');
			}
	}
}

return view.extend({
	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json']))
	},

	render: function(mData) {
		var m, s, o;

		var json = JSON.parse(mData);
		var modem = json.modem;
		var modemen, sbands, mmm;
		for (var i = 0; i < json.enabled.length; i++) 
			{
				modemen += 'B' + json.enabled[i] + '  ';
				mmm += json.enabled[i];
				modemen = modemen.replace('undefined', '');
		}

		for (var i = 0; i < json.supported.length; i++) 
			{
				sbands += 'B' + json.supported[i].band + '  ';
				sbands = sbands.replace('undefined', '');
		}

		pollData: poll.add(function() {
			return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json']))
			.then(function(res) {
				var json = JSON.parse(res);

				if ( json.enabled.length != null ) { 

				var renderHTML = "";
				//var strongband = "<span style=\"font-weight:bold;\">%s%s</span>";		

				var view = document.getElementById("modemlteb");
				view.innerHTML  = ' ';
				for (var i = 0; i < json.enabled.length; i++) 
				{
				//renderHTML += 'B' + String.format(strongband, _(""), _(json.enabled[i]))+'  ';
				renderHTML += 'B' +json.enabled[i] + '  ';
  				view.innerHTML  = renderHTML;
				}

				}
				else {
				var view = document.getElementById("modemlteb");
				view.textContent = _('Waiting for device...');
					//ui.showModal(_(''), [
					//E('p', { 'class': 'spinning' }, _('Waiting for device...'))
					//]);
					//}
				}

			});
		});

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
						E('div', { 'class': 'td left', 'id': 'modem' }, [ modem || '-' ]),
					]),

						E('tr', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '33%' }, [ _('LTE bands:')]),
						E('div', { 'class': 'td left', 'id': 'modemlteb' }, [ modemen || '-' ]),
					]),

						E('tr', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '33%' }, [ _('Supported LTE bands:')]),
						E('div', { 'class': 'td left', 'id': 'sbands' }, [ sbands || '-' ]),
					]),

				])
			]);
		}, o, this);

		s = m.section(form.TypedSection, 'modemband', _(''));
		s.anonymous = true;
		s.addremove = false;

		s.tab('bandset', _('Preferred bands settings'));
 
		o = s.taboption('bandset', cbiRichListValue, 'set_bands',
		_('Modification of the bands:'), 
		_("Select the preferred band(s) for the modem. <br /> \
		Remember to save the configuration of the bands before sending to the modem."));

		//Add bands data
		for (var i = 0; i < json.supported.length; i++) 
		{
			o.value(json.supported[i].band, _('B')+json.supported[i].band,json.supported[i].txt);
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

		s = m.section(form.TypedSection);
		s.anonymous = true;
		o = s.option(BANDmagic);


		return m.render();
	},

	handleReset: null
});
