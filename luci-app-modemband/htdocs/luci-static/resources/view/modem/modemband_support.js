'use strict';
'require form';
'require fs';
'require view';
'require ui';
'require uci';
'require dom';
'require tools.widgets as widgets';

/*

  Copyright 2025-2026 Rafał Wabik - IceG - From eko.one.pl forum
  
  MIT License
  
*/

function handleOpen(ev) {
	if (ev === 'ropenissues')      { window.open('https://github.com/4IceG/luci-app-modemband/issues'); return; }
	if (ev === 'copenissues')      { window.open('https://github.com/obsy/modemband/issues'); return; }
	if (ev === 'opendiscussion')   { window.open('https://github.com/4IceG/luci-app-modemband/discussions'); return; }
	if (ev === 'ropencoffee')      { window.open('https://suppi.pl/rafalwabik'); return; }
	if (ev === 'copencoffee')      { window.open('https://buycoffee.to/eko.one.pl'); return; }
	if (ev === 'opensupport')      { window.open('https://github.com/sponsors/4IceG'); return; }
	if (ev === 'opentopic')        { window.open('https://eko.one.pl/forum/viewtopic.php?id=21761'); return; }
}

return view.extend({
	load: function () {
		return uci.load('modemband');
	},

	render: function (data) {
		let m, s, o;

		let info = _('The tab allows users to support the package.');

		m = new form.Map('modemband', _('Package update and support'), info);

		s = m.section(form.TypedSection);
		s.anonymous = true;

		s.tab('info', _('Modemband Info'));
		
		let packages = [
			{
				package: _('Modemband'),
				author: 'Cezary Jackiewicz (obsy)',
				authorLink: 'https://github.com/obsy',
				buttons: [
					{
						class: 'cbi-button-action important',
						label: _('Buy a coffee'),
						tooltip: _('Buy a coffee if you want to support the development of the project and the author'),
						action: 'copencoffee',
						disabled: false
					},
					{
						class: 'cbi-button-remove',
						label: _('Report a bug'),
						tooltip: _('Report a bug on the package Github page'),
						action: 'copenissues',
						disabled: false
					}
				]
			},
			{
				package: _('Luci-app-modemband'),
				author: 'Rafał Wabik (IceG)',
				authorLink: 'https://github.com/4IceG',
				buttons: [
					{
						class: 'cbi-button-action important',
						label: _('Buy a coffee'),
						tooltip: _('Buy a coffee if you want to support the development of the project and the author'),
						action: 'ropencoffee',
						disabled: false
					},
					{
						class: 'cbi-button-action',
						label: _('Become a sponsor'),
						tooltip: _('Become a sponsor if you want to support the development of the project and the author'),
						action: 'opensupport',
						disabled: false
					},
					{
						class: 'cbi-button-add',
						label: _('Write on forum'),
						tooltip: _('Write in the topic of the package on the forum eko.one.pl'),
						action: 'opentopic',
						disabled: false
					},
					{
						class: 'cbi-button-neutral',
						label: _('Open discussion'),
						tooltip: _('Open a package discussion on Github'),
						action: 'opendiscussion',
						disabled: false
					},
					{
						class: 'cbi-button-remove',
						label: _('Report a bug'),
						tooltip: _('Report a bug on the package Github page'),
						action: 'ropenissues',
						disabled: false
					}
				]
			}
		];

		let rows = [];
		let table = E('table', { 
		    'class': 'table', 
            'style': 'border:1px solid var(--border-color-medium)!important; table-layout:fixed; border-collapse:collapse; width:100%;'
            }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Package name')),
				E('th', { 'class': 'th' }, _('Author (package maintainer)')),
				E('th', { 'class': 'th nowrap cbi-section-actions' })
			])
		]);

		for (let i = 0; i < packages.length; i++) {
			let pkg = packages[i];
			let buttonElements = [];

			for (let j = 0; j < pkg.buttons.length; j++) {
				let btn = pkg.buttons[j];
				let buttonAttrs = {
					'class': 'btn ' + btn.class,
					'data-tooltip': btn.tooltip
				};
				
				if (btn.disabled) {
					buttonAttrs.disabled = true;
				} else if (btn.action) {
					buttonAttrs.click = function() { return handleOpen(btn.action); };
				}
				
				buttonElements.push(E('button', buttonAttrs, btn.label));
			}

			let authorCell = pkg.author ? 
				E('a', { 'href': pkg.authorLink, 'target': '_blank', 'style': 'color:#37c' }, pkg.author) : 
				'';

			rows.push([
				pkg.package,
				authorCell,
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 0.5em;' }, buttonElements)
			]);
		}

		cbi_update_table(table, rows);

		o = s.taboption('info', form.DummyValue, '_packages_info');
		o.render = function() {
			return E('div', { 'class': 'cbi-section' }, [
				E('p', {}, _('Information about package author and available support options.')),
				table
			]);
		};

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
