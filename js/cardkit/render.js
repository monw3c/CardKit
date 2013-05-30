
define([
    'dollar',
    'mo/lang',
    'mo/template',
    './tpl/unit/box',
    './tpl/unit/list',
    './tpl/unit/mini',
    './tpl/unit/form',
    './tpl/unit/banner',
    './tpl/unit/blank',
    './tpl/layout/navdrawer',
    './tpl/layout/actionbar',
    './parser/box',
    './parser/list',
    './parser/mini',
    './parser/form',
    './parser/banner',
    './parser/actionbar',
    './parser/navdrawer'
], function($, _, tpl, 
    tpl_box, tpl_list, tpl_mini, tpl_form, tpl_banner, tpl_blank, 
    tpl_navdrawer, tpl_actionbar,
    boxParser, listParser, miniParser, formParser, 
    bannerParser, actionbarParser, navdrawerParser){

    var frame_parts = {
            'navdrawer': navdrawerParser, 
            'actionbar': actionbarParser
        },

        SCRIPT_TAG = 'script[type="text/cardscript"]',

        TPL_BLANK_BANNER = '<div class="ck-banner-unit"></div>';

    var exports = {

        initCard: function(card, raw, footer, opt) {

            if (!opt.isModal) {

                card.find(SCRIPT_TAG).forEach(run_script, card[0]);
                card.trigger('card:loaded', {
                    card: card
                });

                var banner_cfg = card.find('.ck-banner-unit');
                if (!banner_cfg[0]) {
                    banner_cfg = $(TPL_BLANK_BANNER);
                }
                card.prepend(banner_cfg);

            }

            var units = card.find('.ck-box-unit, .ck-mini-unit, .ck-list-unit, .ck-form-unit, .ck-banner-unit'),
                config = {
                    blank: card.data('cfgBlank')
                };

            var has_content = exports.initUnit(units, raw);

            if (!has_content && !opt.isModal && config.blank != 'false') {
                card.append(tpl.convertTpl(tpl_blank.template, {
                    config: config
                }, 'data'));
            }

            if (!opt.isModal) {

                card.append(footer.clone());

                card.trigger('card:ready', {
                    card: card
                });

            }

        },

        openCard: function(card, opt){
            if (!opt.isModal) {
                card.trigger('card:open', {
                    card: card
                });
            }
        },

        closeCard: function(card, opt){
            if (!opt.isModal) {
                card.trigger('card:close', {
                    card: card
                });
            }
        },

        initUnit: function(units, raw){
            var has_content;
            $(units).forEach(function(unit){
                var type = (/ck-(\w+)-unit/.exec(unit.className) || [])[1];
                if (type) {
                    if (exports[type](unit, raw)) {
                        has_content = true;
                    }
                }
            });
            return has_content;
        },

        banner: function(unit, raw){
            var data = bannerParser(unit, raw);
            unit.innerHTML = tpl.convertTpl(tpl_banner.template, data, 'data');
        },

        box: function(unit, raw){
            var data = boxParser(unit, raw);
            if (data.hasContent || data.hd) {
                unit.innerHTML = tpl.convertTpl(tpl_box.template, data, 'data');
                return true;
            } else {
                $(unit).remove();
            }
        },

        mini: function(unit, raw){
            var data = miniParser(unit, raw);
            data.items = data.items.filter(function(item){
                if (!item.title && !item.author 
                        && (!item.content || !item.content.length)) {
                    return false;
                }
                return true;
            }, data);
            if (!data.items.length 
                    && (!data.hd || data.config.blank == 'false')) {
                $(unit).remove();
                return;
            }
            if (data.config.limit 
                    && data.config.limit < data.items.length) {
                data.items.length = data.config.limit;
            }
            unit.innerHTML = tpl.convertTpl(tpl_mini.template, data, 'data');
            return true;
        },

        list: function(unit, raw){
            var data = listParser(unit, raw);
            data.items = data.items.filter(function(item){
                var style = this.style;
                if (style === 'more' || style === 'menu') {
                    if (!item.title) {
                        return false;
                    }
                } else if (style === 'grid') {
                    if (!item.icon) {
                        return false;
                    }
                } else if (!item.title && !item.author) {
                    return false;
                }
                return true;
            }, data);
            if (data.config.limit 
                    && data.config.limit < data.items.length) {
                data.items.length = data.config.limit;
            }
            if (!data.items.length 
                    && (!data.hd || data.config.blank == 'false')) {
                $(unit).remove();
            } else {
                unit.innerHTML = tpl.convertTpl(tpl_list.template, data, 'data');
                return true;
            }
        },

        form: function(unit, raw){
            var data = formParser(unit, raw);
            if (!data.items.length 
                    && (!data.hd || data.config.blank == 'false')) {
                $(unit).remove();
            } else {
                unit.innerHTML = tpl.convertTpl(tpl_form.template, data, 'data');
                return true;
            }
        },

        _frameConfig: {},
        _frameCustomized: {},

        setFrame: function(card, header, raw){
            var cfg = this._frameConfig,
                customized = this._frameCustomized,
                global_cfg,
                cfg_node,
                changed = {};
            for (var part in frame_parts) {
                if (!cfg[part] || customized[part]) {
                    global_cfg = header.find('.ckcfg-' + part);
                    if (global_cfg[0]) {
                        cfg[part] = frame_parts[part](global_cfg, raw);
                        changed[part] = true;
                    }
                }
                cfg_node = card.find('.ckcfg-' + part);
                customized[part] = !!cfg_node[0];
                if (customized[part]) {
                    cfg[part] = frame_parts[part](cfg_node, raw);
                    changed[part] = true;
                }
            }
            if (changed['actionbar']) {
                $('.ck-top-actions').html(tpl.convertTpl(tpl_actionbar.template, cfg));
            }
            if (changed['navdrawer']) {
                $('.ck-nav-navdrawer').html(tpl.convertTpl(tpl_navdrawer.template, cfg));
            }
        }
    
    };

    function run_script(script){
        new Function('', script.innerHTML).call(this);
    }

    return exports;

});
