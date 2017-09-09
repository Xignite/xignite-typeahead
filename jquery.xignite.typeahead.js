(function ($) {
    // Hack to make update work
    var apitoken;
    $.widget("ui.xigniteTypeahead", {
        _create: function () {
            // defaults
            var defaults = {
                api: '',
                keyParam: 'key',
                q: 'q',
                token: '_token',
                userid: '_token_userid'
            };

            $.extend(defaults, this.options || {});

            if (!String.prototype.trim) {
                String.prototype.trim = function () {
                    return this.replace(/^\s+|\s+$/gm, '');
                };
            }

            var self = this;
            var input = self.element;
            var key = input.data('xignite-typeahead-key');
            var invalidKeyText = input.data('xignite-typeahead-invalid-key-text');
            apitoken = input.data('xignite-typeahead-token');
            var userid = input.data('xignite-typeahead-userid');
            var dropDown = null;
            var lastTerm = '';

            var escapeRegExp = function (str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            };

            var isDisabled = function () {
                return input.data('xignite-typeahead-disabled');
            };

            var disable = function (text) {
                input.data('xignite-typeahead-disabled', 'true');
                if (text) {
                    input.data('xignite-typeahead-disabled-text', text);
                } else {
                    input.removeData('xignite-typeahead-disabled-text');
                }
            };

            var isPrintableKey = function (keyCode) {
                var printable =
					   keyCode == 8 ||
					   (keyCode > 47 && keyCode < 58) || // number keys
					   (keyCode > 64 && keyCode < 91) || // letter keys
					   (keyCode > 95 && keyCode < 112) || // numpad keys
					   (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
					   (keyCode > 218 && keyCode < 223);   // [\]' (in order)
                return printable;
            };

            var initInput = function () {
                // input listeners
                input.on('input propertychange', function () {
                    var term = getSearchTerm();
                    if (term != lastTerm) {
                        getSuggestions(getSearchTerm());
                        lastTerm = term;
                    }

                    if (getSearchTerm().length == 0) {
                        if (dropDown) {
                            dropDown.hide();
                        }
                    }
                });
            };

            var initDropDown = function () {
                // dropdown listeners						
                input.on('keydown', function (e) {
                    switch (e.which) {
                        case 13: // enter
                            if (dropDown.is(':visible')) {
                                selectItem(dropDown.children('.selected'));
                            }
                            return false;
                        case 9: // tab
                        case 27: // esc
                            dropDown.hide();
                            return true;
                            // case 37: // left
                            // case 39: // right
                        case 38: // up
                            navigateDropDown(-1);
                            return false;
                        case 40: // down
                            navigateDropDown(1);
                            return false;
                    }

                    return true;
                });

                dropDown.on('keydown', function (e) {
                    switch (e.which) {
                        case 27: // esc
                            dropDown.hide();
                            return false;
                            // case 37: // left
                            // case 39: // right
                        case 38: // up
                            navigateDropDown(-1);
                            return false;
                        case 40: // down
                            navigateDropDown(1);
                            return false;
                    }

                    return true;
                });

                dropDown.on('mouseover', function (e) {
                    var item = $(e.target);

                    if (item.parent().hasClass('multidropdown-dropdown-item')) {
                        item = item.parent();
                    }

                    dropDown.children('.xigniteTypeahead-dropdown-item').removeClass('selected');

                    if (item.hasClass('xigniteTypeahead-dropdown-item')) {
                        item.addClass('selected');
                    }
                });

                dropDown.on('mousedown', function (e) {
                    var item = $(e.target);

                    if (item.parent().hasClass('multidropdown-dropdown-item')) {
                        item = item.parent();
                    }

                    selectItem(item);
                });

                $('html').click(function () {
                    dropDown.hide();
                });
            };

            var selectItem = function (item) {
                if (!item.data('xignite-typeahead-value'))
                    item = item.parent();
                if (!item.data('xignite-typeahead-value'))
                    return;
                var text = input.val();
                var terms = text.split(',');
                terms[terms.length - 1] = item.data('xignite-typeahead-value');
                input.val(terms.join());
                input.trigger('keyup');
                dropDown.hide();
                input.change();
            };

            var getSearchTerm = function () {
                var needle = input.val();
                var terms = needle.split(',');
                return terms[terms.length - 1].trim();
            };

            var navigateDropDown = function (travel) {
                // travel = relative offset from current item...example: -1 is one up, +2 is two down
                if (!dropDown) {
                    return;
                }

                var items = dropDown.children('.xigniteTypeahead-dropdown-item');
                for (var i = 0; i < items.length; i++) {
                    var item = $(items[i]);
                    if (item.hasClass('selected')) {
                        item.removeClass('selected');
                        var next = items.length + i + travel;
                        $(items[next % items.length]).addClass('selected');
                        break;
                    }
                }
            };

            var displaySuggestions = function (results, text) {
                var itemsHtml = '';
            
                var needle = getSearchTerm();
                

                if (text && text.length > 0) {
                    itemsHtml = '<li class="xigniteTypeahead-dropdown-text">' + text + '</li>';
                }
                else if (results && results.SearchTerm && results.SearchTerm == needle) {

                    var suggestions = results.Results;

                    // to handle whole parts
                    var rg = new RegExp('(^|[\^])' + escapeRegExp(needle), 'gi');
                    // to handle individual parts
                    var prg = new RegExp('(^|[ \-])' + escapeRegExp(needle), 'gi');

                    if (suggestions && $.isArray(suggestions)) {
                        $.each(suggestions, function (i, s) {

                            text = s.Value.replace(rg, function (str) { return '<strong>' + str + '</strong>'; });

                            if (s.Tag && s.Tag.length > 0) {
                                text += '<span class="xigniteTypeahead-dropdown-item-tag">' + s.Tag + '</span>';
                            }

                            if (s.Description && s.Description.length > 0) {
                                text += '<br/>' + s.Description.replace(prg, function (str) { return '<strong>' + str + '</strong>'; });
                            }

                            var itemHtml = '<li class="xigniteTypeahead-dropdown-item' + (i == 0 ? ' selected ' : '') + '" data-xignite-typeahead-value="' + s.Value + '">' + text + '</li>';
                            itemsHtml += itemHtml;
                        });
                    }
                }

                if (!dropDown) {
                    dropDown = $('<ul class="xigniteTypeahead-dropdown"></ul>');
                    initDropDown();
                    input.after(dropDown);
                }

                if (itemsHtml.length > 0) {
                    dropDown.html(itemsHtml).show();
                }
                else {
                    dropDown.html(itemsHtml).hide();
                }
            };

            var getSuggestions = function (term) {
                var disabledText = input.data('xignite-typeahead-disabled-text');

                if (isDisabled()) {
                    displaySuggestions(null, disabledText);
                    return;
                }

                else if (key && key.length > 0) {
                    if (term && term.length > 0) {
                        var params = {};
                        params[defaults.keyParam] = key;
                        params[defaults.q] = term;
                        params[defaults.token] = apitoken;
                        params[defaults.userid] = userid;
                        params['limit'] = '';
                        params['tags'] = '';
                        if (key && key.length > 0) {
                            $.ajax({
                                type: 'GET',
                                url: defaults.api,
                                data: params,
                                dataType: 'json',
                                success: function (results) {
                                    try {
                                        displaySuggestions(results);
                                    } catch (err) {
                                        // swallow
                                    }
                                },
                                statusCode: {
                                    204: function () {
                                        disable();
                                        displaySuggestions(null, invalidKeyText);
                                    }
                                }
                            });
                        }
                    }
                    else {
                        if (dropDown) {
                            dropDown.html('');
                            dropDown.hide();
                        }
                    }
                }
                else {
                    displaySuggestions(null, invalidKeyText);
                }
            };

            initInput();
        },
        update: function(newtoken){
            apitoken = newtoken;
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);