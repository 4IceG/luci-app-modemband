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
    Copyright 2022-2026 Rafał Wabik - IceG - From eko.one.pl forum
*/

let CBISelectswitch = form.DummyValue.extend({
    renderWidget: function (section_id, option_id, cfgvalue) {
        let section = this.section;

        return E([], [
            E('span', { 'class': 'control-group' }, [
                E('button', {
                    'class': 'cbi-button cbi-button-apply',
                    'click': ui.createHandlerFn(this, function () {
                        let dropdown = section.getUIElement(section_id, 'set_5gsabands');
                        dropdown && dropdown.setValue([]);
                    }),
                }, _('Deselect all')),
                ' ',
                E('button', {
                    'class': 'cbi-button cbi-button-action important',
                    'click': ui.createHandlerFn(this, function () {
                        let dropdown = section.getUIElement(section_id, 'set_5gsabands');
                        if (!dropdown) return;
                        let all = Object.keys(dropdown.choices || {});
                        dropdown.setValue(all);
                    })
                }, _('Select all'))
            ])
        ]);
    },
});

let BANDmagic = form.DummyValue.extend({
    load: function () {
        let restoreButton = E('button', {
            'class': 'btn cbi-button cbi-button-reset',
            'click': ui.createHandlerFn(this, function () {
                return handleAction('resetbandz');
            }),
        }, _('Restore'));

        return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh'), 'null')
            .then(L.bind(function (html) {
                if (html == null) {
                    this.default = E('em', {}, [_('The modemband error.')]);
                }
                else {
                    this.default = E([
                        E('div', { 'class': 'cbi-value' }, [
                            E('label', { 'class': 'cbi-value-title' }, _('Restore default bands')),
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

let cbiRichListValue = form.ListValue.extend({
    renderWidget: function (section_id, option_index, cfgvalue) {
        let choices = this.transformChoices();
        let widget = new ui.Dropdown(
            (cfgvalue != null) ? cfgvalue : this.default,
            choices,
            {
                id: this.cbid(section_id),
                sort: this.keylist,
                optional: true,
                multiple: true,
                display_items: 5,
                dropdown_items: 10,
                select_placeholder: this.select_placeholder || this.placeholder,
                custom_placeholder: this.custom_placeholder || this.placeholder,
                validate: L.bind(this.validate, this, section_id),
                disabled: (this.readonly != null) ? this.readonly : this.map.readonly
            }
        );

        if (this.option === 'set_5gsabands')
            window.__set5gsaBandsDropdown = widget;

        return widget.render();
    },

    value: function (value, title, description) {
        if (description) {
            form.ListValue.prototype.value.call(this, value,
                E([], [
                    E('span', { 'class': 'hide-open' }, [title]),
                    E('div', { 'class': 'hide-close', 'style': 'min-width:25vw' }, [
                        E('strong', [title]),
                        E('br'),
                        E('span', { 'style': 'white-space:normal' }, description)
                    ])
                ])
            );
        }
        else {
            form.ListValue.prototype.value.call(this, value, title);
        }
    }
});

function pop(a, message, severity) {
    ui.addNotification(a, message, severity);
}

function popTimeout(a, message, timeout, severity) {
    ui.addTimeLimitedNotification(a, message, timeout, severity);
}

function handleAction(ev) {
    if (ev === 'reload') {
        location.reload();
    }
    if (ev === 'resetbandz') {
        if (confirm(_('Do you really want to set up all possible bands for the modem?'))) {
            fs.exec_direct('/usr/bin/modemband.sh', ['setbands5gsa', 'default']);
            popTimeout(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible, a restart of the connection, modem or router may be required.')), 5000, 'info');
        }
    }
}

function updateTileColorsFromEnabled5gsa(enabledArray) {
    try {
        let enabledNs = new Set(
            (enabledArray || [])
                .map(function (v) {
                    let m = v.toString().match(/\d+$/);
                    return m ? ('n' + m[0]) : null;
                })
                .filter(Boolean)
        );

        let grid = document.getElementById('bands-grid');
        if (!grid) return;

        grid.querySelectorAll('[data-band]').forEach(function (node) {
            let key = node.getAttribute('data-band');
            let isOn = enabledNs.has(key);

            node.classList.add('band-tile');
            node.classList.toggle('band-tile--on',  !!isOn);
            node.classList.toggle('band-tile--off', !isOn);

            node.style.backgroundColor = '';
            node.style.color = '';
        });
    } catch (e) {}
}

function isValid5gData(json) {
    return json &&
           json.supported5gsa &&
           Array.isArray(json.supported5gsa) &&
           json.supported5gsa.length > 0 &&
           json.enabled5gsa &&
           Array.isArray(json.enabled5gsa);
}

let pollId;

return view.extend({
    formdata: { modemband: {} },
    isModemSupported: true,

    handleModemChange: function(ev) {
        let sections = uci.sections('defmodems', 'defmodems');
        if (!sections || sections.length === 0) return;
        
        let serialModems = sections.filter(function(s) {
            return s.modemdata === 'serial';
        });
        
        if (serialModems.length === 0) return;
        
        let currentPort = uci.get('modemband', '@modemband[0]', 'set_port');
        let currentIndex = serialModems.findIndex(function(s) {
            return s.comm_port === currentPort;
        });
        
        if (currentIndex === -1) currentIndex = 0;
        
        let direction = ev.currentTarget.classList.contains('next') ? 1 : -1;
        let newIndex = (currentIndex + direction + serialModems.length) % serialModems.length;
        let newModem = serialModems[newIndex];
        
        if (newModem && newModem.comm_port) {
            uci.set('modemband', '@modemband[0]', 'set_port', newModem.comm_port);
            uci.save();
            uci.apply().then(function() {
                let modemText = document.querySelector('.modem-display-text');
                if (modemText) {
                    let label = newModem.modem + (newModem.user_desc ? ' (' + newModem.user_desc + ')' : '');
                    modemText.textContent = label;
                }
                setTimeout(function() {
                    location.reload();
                }, 1000);
            });
        }
    },

    addStyles: function () {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = `
        :root {
          --tile-on-bg: #34c759;              /* ON */
          --tile-off-bg: #7f8c8d;             /* OFF */
          --tile-text: #ffffff;
          --tile-on-ring: #34c759;
          --tile-off-ring: #7f8c8d;
          --tile-shadow: 0 1px 2px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.25);
        }
        :root[data-darkmode="true"] {
          --tile-on-bg: rgba(46, 204, 113, 0.22);   /* ON */
          --tile-off-bg: rgba(255, 255, 255, 0.08); /* OFF */
          --tile-text: #e5e7eb;
          --tile-on-ring: #2ecc71;
          --tile-off-ring: rgba(255,255,255,.28);
          --tile-shadow: 0 1px 2px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.22);
        }
        .band-tile {
          background-color: var(--tile-off-bg);
          color: var(--tile-text);
          border: 1px solid var(--tile-off-ring);
          box-shadow: var(--tile-shadow);
          font-weight: 600;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          text-shadow: 0 1px 2px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.25);
          user-select: none;
        }

        .ifacebox {
          min-width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .ifacebox-body {
          flex: 1 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .ifacebox-head port-label {
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .band-tile.band-tile--on  { background-color: var(--tile-on-bg);  border-color: var(--tile-on-ring); }
        .band-tile.band-tile--off { background-color: var(--tile-off-bg); border-color: var(--tile-off-ring); }
        `;
        document.head.appendChild(style);
    },

    load: function () {
        return Promise.all([
            L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json'])),
            L.resolveDefault(uci.load('defmodems')),
            uci.load('modemband')
        ]).then(function(results) {
            return results[0];
        });
    },

    renderErrorMessage: function(title, message, forumUrl) {
        let container = E('div', { 'class': 'cbi-map' }, [
            E('h2', { 'name': 'content' }, _('5G SA Bands Configuration')),
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'class': 'cbi-section-node' }, [
                    E('div', {
                        'class': 'alert-message warning',
                        'style': 'padding: 15px; margin: 15px 0; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;'
                    }, [
                        E('h4', { 'style': 'margin-top: 0; color: #856404;' }, [
                            E('strong', {}, title)
                        ]),
                        E('p', { 'style': 'margin-bottom: 10px; color: #856404;' }, message),
                        E('p', { 'style': 'margin-bottom: 0; color: #856404;' }, [
                            _('More information about the modemband application on the')+' ',
                            E('a', {
                                'href': forumUrl,
                                'target': '_blank',
                                'style': 'color: #0056b3; text-decoration: underline;'
                            }, _('eko.one.pl forum')),
                            '.'
                        ])
                    ])
                ])
            ])
        ]);

        return container;
    },

    render: function (data) {
        this.addStyles();

        let json = null;

        if (data != null && typeof data === 'string' && data.includes('No supported modem was found')) {
            this.isModemSupported = false;
            return this.renderErrorMessage(
                _('Unsupported Modem'),
                _('No supported modem was found. Check if your modem supports this technology and if it is in the list of supported modems.'),
                'https://eko.one.pl/?p=openwrt-modemband'
            );
        }

        if (data != null) {
            try {
                json = JSON.parse(data);
            } catch (err) {
                this.isModemSupported = false;
                return this.renderErrorMessage(
                    _('Configuration Error'),
                    _('5G bands cannot be read. Check if your modem supports this technology and if it is in the list of supported modems.'),
                    'https://eko.one.pl/?p=openwrt-modemband'
                );
            }
        }

        if (!isValid5gData(json)) {
            this.isModemSupported = false;
            return this.renderErrorMessage(
                _('Configuration Error'),
                _('5G bands cannot be read. Check if your modem supports this technology and if it is in the list of supported modems.'),
                'https://eko.one.pl/?p=openwrt-modemband'
            );
        }

        this.isModemSupported = true;

        let m, s, o;

        let info = _('Configuration modem frequency bands. More information about the modemband application on the %seko.one.pl forum%s.')
            .format('<a href="https://eko.one.pl/?p=openwrt-modemband" target="_blank">', '</a>');

        m = new form.JSONMap(this.formdata, _('5G SA Bands Configuration'), info);

        let sections = uci.sections('defmodems', 'defmodems');
        let serialModems = [];
        
        if (sections && sections.length > 0) {
            serialModems = sections.filter(function(s) {
                return s.modemdata === 'serial';
            });
        }
        
        let currentPort = uci.get('modemband', '@modemband[0]', 'set_port');
        let currentModem = serialModems.find(function(s) {
            return s.comm_port === currentPort;
        });
        
        if (!currentModem && serialModems.length > 0) currentModem = serialModems[0];

        s = m.section(form.TypedSection, 'modemband', '', _(''));
        s.anonymous = true;
        s.render = L.bind(function (view, section_id) {
            const TILE_W = 50, TILE_H = 25, RADIUS = 4;

            let modemContainer = E('div', {
                'class': 'ifacebox',
                'style': 'margin:.25em;width:100%;text-align:center;'
            }, [
                E('div', {
                    'id': 'modem-title',
                    'class': 'ifacebox-head port-label',
                    'style': 'font-weight:bold;padding:8px'
                }, [json.modem || '-']),
            ]);

            let blockWrap = E('div', { 'style': 'margin-inline:20px;' });

            let container = E('div', {
                'id': 'bands-grid',
                'style':
                    'display:grid;' +
                    'grid-template-columns:repeat(auto-fill, ' + TILE_W + 'px);' +
                    'grid-auto-rows:' + TILE_H + 'px;' +
                    'justify-content:flex-start;' +
                    'gap:6px;' +
                    'margin-top:10px;padding:10px;margin-bottom:10px;'
            });

            (json.supported5gsa || []).forEach(function (supported) {
                let band = supported.band.toString();
                let numb = band.match(/\d+$/);
                let bandName = 'n' + (numb ? numb[0] : band);
                let isEnabled = (json.enabled5gsa || []).includes(supported.band);

                let bandDiv = E('div', {
                    'data-band': bandName,
                    'class': 'band-tile ' + (isEnabled ? 'band-tile--on' : 'band-tile--off'),
                    'style':
                        'width:' + TILE_W + 'px;min-width:' + TILE_W + 'px;max-width:' + TILE_W + 'px;' +
                        'height:' + TILE_H + 'px;min-height:' + TILE_H + 'px;max-height:' + TILE_H + 'px;' +
                        'border-radius:' + RADIUS + 'px;'
                }, [bandName]);

                container.appendChild(bandDiv);
            });

            let legend = E('div', {
                'style': 'display:flex;flex-direction:column;align-items:flex-start;' +
                    'gap:8px;margin-left:12px;margin-top:10px;margin-bottom:14px;'
            }, [
                E('div', { 'style': 'display:flex;align-items:center;gap:10px;' }, [
                    E('div', {
                        'class': 'band-tile band-tile--on',
                        'style':
                            'width:' + TILE_W + 'px;min-width:' + TILE_W + 'px;max-width:' + TILE_W + 'px;' +
                            'height:' + TILE_H + 'px;min-height:' + TILE_H + 'px;max-height:' + TILE_H + 'px;' +
                            'border-radius:' + RADIUS + 'px;'
                    }, ['\xa0']),
                    E('label', {}, _('Currently set 5G SA bands'))
                ]),
                E('div', { 'style': 'display:flex;align-items:center;gap:10px;' }, [
                    E('div', {
                        'class': 'band-tile band-tile--off',
                        'style':
                            'width:' + TILE_W + 'px;min-width:' + TILE_W + 'px;max-width:' + TILE_W + 'px;' +
                            'height:' + TILE_H + 'px;min-height:' + TILE_H + 'px;max-height:' + TILE_H + 'px;' +
                            'border-radius:' + RADIUS + 'px;'
                    }, ['\xa0']),
                    E('label', {}, _('Supported 5G SA bands'))
                ])
            ]);

            blockWrap.appendChild(container);
            blockWrap.appendChild(legend);
            modemContainer.appendChild(blockWrap);
            return modemContainer;
        }, o, this);

        if (serialModems.length > 0 && currentModem) {
            let modemSelectSection = m.section(form.TypedSection, '_modem_selector', '');
            modemSelectSection.anonymous = true;
            modemSelectSection.addremove = false;
            modemSelectSection.render = L.bind(function() {
                let label = currentModem.modem + (currentModem.user_desc ? ' (' + currentModem.user_desc + ')' : '');
                let buttonsDisabled = (serialModems.length > 1) ? null : true;
                
                return E('div', { 'class': 'cbi-section', 'style': 'margin-top:10px !important;' }, [
                    E('div', { 'class': 'cbi-section-node' }, [
                        E('div', { 'class': 'cbi-value' }, [
                            E('label', { 'class': 'cbi-value-title' }, [ _('Select modem') ]),
                            E('div', { 'class': 'cbi-value-field' }, [
                                E('div', { 'class': 'pager center', 'style': 'display: flex; align-items: center; gap: 10px;' }, [
                                    E('button', { 
                                        'class': 'btn cbi-button-neutral prev', 
                                        'aria-label': _('Previous modem'), 
                                        'click': ui.createHandlerFn(this, 'handleModemChange'),
                                        'style': 'min-width: 40px;',
                                        'disabled': buttonsDisabled
                                    }, [ ' ◄ ' ]),
                                    E('div', { 'class': 'text modem-display-text', 'style': 'flex: 1; text-align: center;' }, [ label ]),
                                    E('button', { 
                                        'class': 'btn cbi-button-neutral next', 
                                        'aria-label': _('Next modem'), 
                                        'click': ui.createHandlerFn(this, 'handleModemChange'),
                                        'style': 'min-width: 40px;',
                                        'disabled': buttonsDisabled
                                    }, [ ' ► ' ])
                                ])
                            ])
                        ])
                    ])
                ]);
            }, this);
        }

        s = m.section(form.TypedSection, 'modemband', _(''));
        s.anonymous = true;
        s.addremove = false;

        s.tab('bandset', _('Preferred bands settings'));

        let bandList = s.taboption('bandset', cbiRichListValue, 'set_5gsabands',
            _('Modification of the bands'),
            _("Select the preferred band(s) for the modem.")
        );

        (json.supported5gsa || []).forEach(function (band) {
            bandList.value(band.band, _('n') + band.band, band.txt);
        });

        bandList.multiple = true;
        bandList.placeholder = _('Please select a band(s)');
        bandList.cfgvalue = function (section_id) {
            return L.toArray((json.enabled5gsa || []).join(' '));
        };

        s.taboption('bandset', CBISelectswitch, '_switch', _('Band selection switch'));

        let bfresh = s.taboption('bandset', form.Button, '_refreshbands');
        bfresh.title = _('Bands configuration');
        bfresh.inputtitle = _('Refresh');
        bfresh.onclick = function () { location.reload(); };

        let s2 = m.section(form.TypedSection);
        s2.anonymous = true;
        s2.option(BANDmagic);

        pollId = poll.add(function () {
            return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json'])).then(function (res) {
                try {
                    let data = JSON.parse(res || '{}');
                    let head = document.getElementById('modem-title');
                    if (head) head.textContent = (data.modem || '-');
                    updateTileColorsFromEnabled5gsa(data.enabled5gsa || []);
                } catch (e) {}
            });
        });

        return m.render();
    },

    handleBANDZSETup: function (ev) {
        poll.stop();

        let map = document.querySelector('#maincontent .cbi-map'),
            data = this.formdata;

        return dom.callClassMethod(map, 'save')
            .then(function () {
                let args = [];
                args.push(data.modemband.set_5gsabands);

                let ax = args.toString().replace(/,/g, ' ').trim();

                try {
                    if (window.__set5gsaBandsDropdown && typeof window.__set5gsaBandsDropdown.setValue === 'function') {
                        let picked = ax.length ? ax.split(/\s+/) : [];
                        window.__set5gsaBandsDropdown.setValue(picked);
                    }
                } catch (e) {}

                if (ax.length >= 1) {
                    fs.exec_direct('/usr/bin/modemband.sh', ['setbands5gsa', ax]);
                    popTimeout(null, E('p', _('The new bands settings have been sent to the modem. If the changes are not visible, a restart of the connection, modem or router may be required.')), 5000, 'info');
                    
                    return Promise.all([
                        uci.load('modemband'),
                        uci.load('defmodems')
                    ]).then(function() {
                        try {
                            let wrestart = (uci.get('modemband', '@modemband[0]', 'wanrestart'));
                            let mrestart = (uci.get('modemband', '@modemband[0]', 'modemrestart'));
                            let cmdrestart = (uci.get('modemband', '@modemband[0]', 'restartcmd'));
                            let sport = (uci.get('modemband', '@modemband[0]', 'set_port'));
                            
                            // Pobierz network z defmodems dla danego comm_port
                            let wname = null;
                            let sections = uci.sections('defmodems', 'defmodems');
                            for (let i = 0; i < sections.length; i++) {
                                if (sections[i].comm_port === sport) {
                                    wname = sections[i].network;
                                    break;
                                }
                            }
                            
                            // Fallback do starego formatu jeśli nie znaleziono w defmodems
                            if (!wname) {
                                wname = (uci.get('modemband', '@modemband[0]', 'iface'));
                            }
                            
                            if (wrestart == '1' && wname) {
                                fs.exec('/sbin/ifdown', [ wname ]);
                                fs.exec('sleep 3');
                                fs.exec('/sbin/ifup', [ wname ]);
                            }

                            if (mrestart == '1') {
                                fs.exec('sleep 20');
                                fs.exec_direct('/usr/bin/sms_tool', [ '-d' , sport , 'at' , cmdrestart ]);
                            }
                        } catch (e) {}
                    });

                } else {
                    ui.addNotification(null, E('p', _('Check if you have selected the bands correctly.')), 'info');
                }

                return L.resolveDefault(fs.exec_direct('/usr/bin/modemband.sh', ['json'])).then(function (res) {
                    try {
                        let fresh = JSON.parse(res || '{}');
                        let head = document.getElementById('modem-title');
                        if (head) head.textContent = (fresh.modem || '-');
                        updateTileColorsFromEnabled5gsa(fresh.enabled5gsa || []);

                        if (window.__set5gsaBandsDropdown) {
                            let current = (fresh.enabled5gsa || []).map(String);
                            window.__set5gsaBandsDropdown.setValue(current);
                        }
                    } catch (e) {}
                });
            })
            .finally(function () {
                poll.start();
            });
    },

    addFooter: function () {
        if (!this.isModemSupported) {
            return null;
        }
        return E('div', { 'class': 'cbi-page-actions' }, [
            E('button', { 'class': 'cbi-button cbi-button-save', 'click': L.ui.createHandlerFn(this, 'handleBANDZSETup') },
                [_('Apply changes')])
        ]);
    }
});
