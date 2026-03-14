'use strict';
'require form';
'require view';
'require uci';
'require ui';
'require poll';
'require tools.nikki as nikki';

function renderStatus(running) {
    return updateStatus(E('input', { id: 'core_status', style: 'border: unset; font-style: italic; font-weight: bold;', readonly: '' }), running);
}

function updateStatus(element, running) {
    if (element) {
        element.style.color = running ? 'green' : 'red';
        element.value = running ? _('🟢 Running') : _('🔴 Not Running');
    }
    return element;
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            nikki.version(),
            nikki.status(),
            nikki.listProfiles()
        ]);
    },
    render: function (data) {
        const subscriptions = uci.sections('nikki', 'subscription');
        const appVersion = data[1].app ?? '';
        const coreVersion = data[1].core ?? '';
        const running = data[2];
        const profiles = data[3];

        let m, s, o;

        m = new form.Map('nikki', _('Nikki'), `${_('Transparent Proxy with Mihomo on OpenWrt.')} <a href="https://github.com/nikkinikki-org/OpenWrt-nikki/wiki" target="_blank">${_('How To Use')}</a>`);

        s = m.section(form.TableSection, 'status', _('🔋 Status'));
        s.anonymous = true;

        o = s.option(form.Value, '_app_version', _('App Version'));
        o.readonly = true;
        o.load = function () {
            return appVersion;
        };
        o.write = function () { };

        o = s.option(form.Value, '_core_version', _('Core Version'));
        o.readonly = true;
        o.load = function () {
            return coreVersion;
        };
        o.write = function () { };

        o = s.option(form.DummyValue, '_core_status', _('Core Status'));
        o.cfgvalue = function () {
            return renderStatus(running);
        };
        poll.add(function () {
            return L.resolveDefault(nikki.status()).then(function (running) {
                updateStatus(document.getElementById('core_status'), running);
            });
        });

        o = s.option(form.Button, 'reload');
        o.inputstyle = 'action';
        o.inputtitle = _('Reload Service');
        o.onclick = function () {
            return nikki.reload();
        };

        o = s.option(form.Button, 'restart');
        o.inputstyle = 'negative';
        o.inputtitle = _('Restart Service');
        o.onclick = function () {
            return nikki.restart();
        };

        o = s.option(form.Button, 'update_dashboard');
        o.inputstyle = 'positive';
        o.inputtitle = _('Update Dashboard');
        o.onclick = function () {
            return nikki.updateDashboard();
        };

        o = s.option(form.Button, 'open_dashboard');
        o.inputtitle = _('Open Dashboard');
        o.onclick = function () {
            return nikki.openDashboard();
        };

        s = m.section(form.NamedSection, 'config', 'config', _('✨ App Config'));

								o = s.option(form.DummyValue, '_enabled_toggle', _('Enable'));
								o.rawhtml = true;
								o.cfgvalue = function(section_id) {
												const enabled = uci.get('nikki', section_id, 'enabled') == '1';

												return `
																<label class="nikki-switch">
																				<input type="checkbox"
																											class="nikki-switch-input"
																											data-section="${section_id}"
																											${enabled ? 'checked' : ''}>
																				<span class="nikki-switch-slider"></span>
																</label>
												`;
								};

        o = s.option(form.ListValue, 'profile', _('Choose Profile'));
        o.optional = true;

        for (const profile of profiles) {
            o.value('file:' + profile.name, _('File:') + profile.name);
        };

        for (const subscription of subscriptions) {
            o.value('subscription:' + subscription['.name'], _('Subscription:') + subscription.name);
        };

        o = s.option(form.Value, 'start_delay', _('Start Delay'));
        o.datatype = 'uinteger';
        o.placeholder = _('Start Immidiately');

        o = s.option(form.Flag, 'scheduled_restart', _('Scheduled Restart'));
        o.rmempty = false;

        o = s.option(form.Value, 'cron_expression', _('Cron Expression'));
        o.retain = true;
        o.rmempty = false;
        o.depends('scheduled_restart', '1');

        o = s.option(form.Flag, 'test_profile', _('Test Profile'));
        o.rmempty = false;

        o = s.option(form.Flag, 'core_only', _('Core Only'));
        o.rmempty = false;

        s = m.section(form.NamedSection, 'procd', 'procd', _('procd Config'));

        s.tab('general', _('General Config'));

        o = s.taboption('general', form.Flag, 'fast_reload', _('Fast Reload'));
        o.rmempty = false;

        s.tab('rlimit', _('RLIMIT Config'));

        o = s.taboption('rlimit', form.Value, 'rlimit_address_space_soft', _('Address Space Size Soft Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_address_space_hard', _('Address Space Size Hard Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_data_soft', _('Heap Size Soft Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_data_hard', _('Heap Size Hard Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_stack_soft', _('Stack Size Soft Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_stack_hard', _('Stack Size Hard Limit'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unlimited');

        o = s.taboption('rlimit', form.Value, 'rlimit_nofile_soft', _('Number of Open Files Soft Limit'));
        o.datatype = 'uinteger';

        o = s.taboption('rlimit', form.Value, 'rlimit_nofile_hard', _('Number of Open Files Hard Limit'));
        o.datatype = 'uinteger';

        s.tab('environment_variable', _('Environment Variable Config'));

        o = s.taboption('environment_variable', form.DynamicList, 'env_safe_paths', _('Safe Paths'));
        o.load = function (section_id) {
            return this.super('load', section_id)?.split(':');
        };
        o.write = function (section_id, formvalue) {
            this.super('write', section_id, formvalue?.join(':'));
        };

        o = s.taboption('environment_variable', form.Flag, 'env_disable_loopback_detector', _('Disable Loopback Detector'));
        o.rmempty = false;

        o = s.taboption('environment_variable', form.Flag, 'env_disable_quic_go_gso', _('Disable GSO of quic-go'));
        o.rmempty = false;

        o = s.taboption('environment_variable', form.Flag, 'env_disable_quic_go_ecn', _('Disable ECN of quic-go'));
        o.rmempty = false;

        o = s.taboption('environment_variable', form.Flag, 'env_skip_system_ipv6_check', _('Skip System IPv6 Check'));
        o.rmempty = false;

								return m.render().then((node) => {
												node.appendChild(E('style', {}, `
																.nikki-switch {
																				position: relative;
																				display: inline-block;
																				width: 50px;
																				height: 26px;
																				vertical-align: middle;
																}

																.nikki-switch input {
																				opacity: 0;
																				width: 0;
																				height: 0;
																}

																.nikki-switch-slider {
																				position: absolute;
																				cursor: pointer;
																				inset: 0;
																				background-color: #ccc;
																				transition: .25s;
																				border-radius: 26px;
																}

																.nikki-switch-slider:before {
																				position: absolute;
																				content: "";
																				height: 20px;
																				width: 20px;
																				left: 3px;
																				top: 3px;
																				background-color: white;
																				transition: .25s;
																				border-radius: 50%;
																				box-shadow: 0 1px 3px rgba(0,0,0,.25);
																}

																.nikki-switch-input:checked + .nikki-switch-slider {
																				background-color: #0b5fa5;
																}

																.nikki-switch-input:checked + .nikki-switch-slider:before {
																				transform: translateX(24px);
																}

																.nikki-switch-input:disabled + .nikki-switch-slider {
																				opacity: .6;
																				cursor: wait;
																}
												`));

												node.querySelectorAll('.nikki-switch-input').forEach((input) => {
																input.addEventListener('change', () => {
																				const section_id = input.getAttribute('data-section');
																				const value = input.checked ? '1' : '0';

																				input.disabled = true;

																				uci.set('nikki', section_id, 'enabled', value);

																				uci.save()
																								.then(() => uci.apply())
																								.then(() => nikki.reload())
																								.then(() => {
																												window.setTimeout(() => location.reload(), 500);
																								})
																								.catch((err) => {
																												input.disabled = false;
																												ui.addNotification(null, E('p', {}, _('Failed to toggle Nikki: ') + err));
																								});
																});
												});

												return node;
								});
    }
});
