'use strict';
'require form';
'require fs';
'require view';
'require ui';
'require uci';
'require poll';
'require dom';
'require tools.widgets as widgets';

/*
	Copyright 2022 Rafał Wabik - IceG - From eko.one.pl forum
*/

var BANDmagic = form.DummyValue.extend({

	load: function() {
		var setupButton = E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': ui.createHandlerFn(this, function() {
							return handleAction('reload');
						}),
			}, _('Refresh'));

		var restoreButton = E('button', {
				'class': 'btn cbi-button cbi-button-reset',
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

var SYSTmagic = form.DummyValue.extend({

	load: function() {
		var restartButton = E('button', {
				'class': 'btn cbi-button cbi-button-neutral',
				'click': ui.createHandlerFn(this, function() {
							return handleAction('restartwan');
						}),
			}, _('Restart'));

		var rebootButton = E('button', {
				'class': 'btn cbi-button cbi-button-neutral',
				'click': ui.createHandlerFn(this, function() {
							return handleAction('rebootdev');
						}),

			}, _('Perform reboot'));

		return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null').then(L.bind(function(html) {
				if (html == null) {
					this.default = E('em', {}, [ _('The modemband error.') ]);
				}
				else {
					this.default = E([
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' },
							_('Restart WAN')
						),
						E('div', { 'class': 'cbi-value-field', 'style': 'width:25vw' },
								E('div', { 'class': 'cbi-section-node' }, [
									restartButton,
								]),
						),
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' },
							_('Reboot')
						),
						E('div', { 'class': 'cbi-value-field', 'style': 'width:25vw' },
								E('div', { 'class': 'cbi-section-node' }, [
									rebootButton,
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
	if (ev === 'reload') {
		location.reload();
	}
	if (ev === 'resetbandz') {		
		if (confirm(_('Do you really want to set up all possible bands for the modem?')))
			{
			fs.exec_direct('/usr/bin/modemband.sh', [ 'setbands', 'default' ]);
			ui.addNotification(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible, a restart of the connection, modem or router may be required.')), 'info');
			}
	}
	if (ev === 'rebootdev') {
		if (confirm(_('Do you really want to restart the device?')))
		{
			L.ui.showModal(_('Rebooting…'), [
				E('p', { 'class': 'spinning' }, _('Waiting for device...'))
			]);
			fs.exec('/sbin/reboot');
		}
	}
	if (ev === 'restartwan') {
		return uci.load('modemband').then(function() {
		var wname = (uci.get('modemband', '@modemband[0]', 'iface'));

			fs.exec('/sbin/ifdown', [ wname ]);
			fs.exec('sleep 3');
			fs.exec('/sbin/ifup', [ wname ]);
		
    		});
	}
}

return view.extend({
	formdata: { modemband: {} },

	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json']));
	},

	render: function(data) {
		var m, s, o;

		var json = JSON.parse(data);
		var modem = json.modem;
		var modemen, sbands;
		for (var i = 0; i < json.enabled.length; i++) 
		{
				modemen += 'B' + json.enabled[i] + '  ';
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
				//modemen = _('Waiting for device...');
				if ( data != null ) { 

				var renderHTML = "";
				//var strongband = "<span style=\"font-weight:bold;\">%s%s</span>";		

				var view = document.getElementById("modemlteb");
				view.innerHTML = modemen;
				for (var i = 0; i < json.enabled.length; i++) 
				{
				//renderHTML += 'B' + String.format(strongband, _(""), _(json.enabled[i]))+'  ';
				renderHTML += 'B' +json.enabled[i] + '  ';
				view.innerHTML  = '';
  				view.innerHTML  = renderHTML;
				}

				}
				else {
				var view = document.getElementById("modemlteb");
				view.innerHTML = _('Waiting for device...');
				//L.ui.showModal(_(''), [
				//E('p', { 'class': 'spinning' }, _('Waiting for device...'))
				//]);
				}

			});
		});

		var info = _('Configuration modem frequency bands. More information about the modemband application on the') + ' <a href="https://eko.one.pl/?p=openwrt-modemband" target="_blank">' + _('eko.one.pl forum') + '</a>.';

		m = new form.JSONMap(this.formdata, _('Configure modem bands'), info);

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
		s.tab('aoptions', _('Additional options'));
 
		o = s.taboption('bandset', cbiRichListValue, 'set_bands',
		_('Modification of the bands:'), 
		_("Select the preferred band(s) for the modem."));

		for (var i = 0; i < json.supported.length; i++) 
		{
			o.value(json.supported[i].band, _('B')+json.supported[i].band,json.supported[i].txt);
		}

		o.multiple = true;
		o.placeholder = _('Please select a band(s)');

		o.cfgvalue = function(section_id) {
			return L.toArray((json.enabled).join(' '));
		};

		s = m.section(form.TypedSection);
		s.anonymous = true;
		o = s.option(BANDmagic);

		s = m.section(form.TypedSection);
		s.tab('aoptions', _('Additional options'));

		s.anonymous = true;
		o = s.taboption('aoptions', SYSTmagic);

		return m.render();
	},

	handleBANDZSETup: function(ev) {
		var map = document.querySelector('#maincontent .cbi-map'),
		    data = this.formdata;

		return dom.callClassMethod(map, 'save').then(function() {
			var args = [];
			args.push(data.modemband.set_bands);
			var ax = args.toString();
			ax = ax.replace(/,/g, ' ')
			fs.exec_direct('/usr/bin/modemband.sh', [ 'setbands', ax ]);
			ui.addNotification(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible, a restart of the connection, modem or router may be required.') ), 'info');

			return uci.load('modemband').then(function() {
				var wrestart = (uci.get('modemband', '@modemband[0]', 'wanrestart'));
				var mrestart = (uci.get('modemband', '@modemband[0]', 'modemrestart'));
				var cmdrestart = (uci.get('modemband', '@modemband[0]', 'restartcmd'));
				var wname = (uci.get('modemband', '@modemband[0]', 'iface'));
				var sport = (uci.get('modemband', '@modemband[0]', 'set_port'));
				
				if (wrestart == '1') {

				fs.exec('/sbin/ifdown', [ wname ]);
				fs.exec('sleep 3');
				fs.exec('/sbin/ifup', [ wname ]);
				}

				if (mrestart == '1') {

				fs.exec('sleep 15');
				//sms_tool -d $_DEVICE at "cmd"
				fs.exec_direct('/usr/bin/sms_tool', [ '-d' , sport , 'at' , cmdrestart ]);
				}
		
    			});
		});
	},

	addFooter: function() {
		return E('div', { 'class': 'cbi-page-actions' }, [
			E('button', {
				'class': 'cbi-button cbi-button-save',
				'click': L.ui.createHandlerFn(this, 'handleBANDZSETup')
			}, [ _('Apply changes') ])
		]);
	}
});
