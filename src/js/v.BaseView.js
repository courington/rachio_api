const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')

// Base View
module.exports = Backbone.View.extend({
	initialize: function initialize(options) {
		options = options || {}
		this.model = options.model
		this.template = _.template(options.template)
		
		// passing headers down from controller
		this.headers = options.headers || null

		this.listenTo(this.model, 'request', function() {
			this.renderLoader();
		}, this)

		this.listenTo(this.model, 'sync', function() {
			this.render(this.model.toJSON())
		}, this)

		if(!this.model.length) {
			this.model.fetch(this.headers)
		} else {
			this.render(this.model.toJSON())
		}
	},

	render: function render(data) {
		data = data || {}
		this.$el.html(this.template(data))
		
		if(this.$el.hasClass('loading')) {
			this.$el.removeClass('loading').addClass('loaded')
		}

		return this.$el
	},

	renderLoader: function renderLoader() {
		this.$el.html('loading...');
	}
})