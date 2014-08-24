xignite-typeahead
=================

A client side plugin for XigniteSearch

Project dependencies:

1) Get the js and css files. 

2) Get the dependencies (jQuery 1.x is recommended if you intend to support IE 6-8):
    -jQuery http://jquery.com/download/  
    -jQueryUI http://jqueryui.com/download/

3) Create an arbitrary input element in your HTML.  The data-xignite-typeahead-key is required:

<input type="text" class="xignite-typeahead" data-xignite-typeahead-key="XigniteGlobalQuotes.GetGlobalDelayedQuote.Identifier" />

4) Invoke the widget in javascript like so:

<script type="text/javascript">
	$('.xignite-typeahead').xigniteTypeahead({ api: 'http://search.xignite.com/Search/Suggest', keyParam: 'parameter', q: 'term' });
</script>


See http://xignite.github.io/xignite-typeahead for example and more info.
