(function($){

	$.fn.cedilla = function (key, dataParam, lang, options) {

		options || (options = {});

		if (_.isString(key) && _.isString(dataParam) && _.isString(lang)) {
				options.dataParam = dataParam;
				options.lang = lang;
		} else
		if (_.isString(key) && _.isString(dataParam)) {
				options.lang = dataParam;
				options = lang || options;
		} else
		if (!_.isString(key)) {
			options = key || options;
			key = undefined;
		}

		this.each(function(){

			var $this = $(this);

			var nkey = key || $this.data('cedilla');

			$this.data('cedilla',$this.attr('cedilla'));
			$this.removeAttr('data-cedilla');

			var data = options.param ? $this.data(options.param) : $this.data();
				onTranslateBody = $this.attr('ontranslate') || $this.attr('onTranslate');

			var onTranslate =
				onTranslateBody ?
				new Function(onTranslateBody) :
				null;

			_.extend(data, options.data);
			_.defaults(data, options.defualts);

			var partials = $this.cedilla._partials.call($this,{
				data: data
			});

			_.extend(data, partials);

			if (!nkey) return;

			var msg = cedilla(nkey,data,onTranslate);

			$this.html(msg);

		});

		return this;

	}

	$.fn.cedilla._partials = function (options) {

		options || (options = {});

		_.defaults(options, {
			search: true
		});

		var target = options.search ? this.find('*[data-partial]') : this,
			partials = {};

		target.each(function(){

			$this = $(this);
			var func = $this.data('compiledPartial');

			if (!func) {
				var key = $this.data('partial'),
					tmpl =
						$this.data('useInnerHtml') ?
						this.innerHTML : 
						($("<div />").append($(this).clone()).html());
				$this.removeData('partial');
				$this.removeAttr('data-partial');
				func = cedilla.buildFunc(tmpl);
				$this.data('compiledPartial',func);
			}

			partials[key] = func(options.data || {});
		});

		return partials;

	}

})(jQuery);
