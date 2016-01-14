const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')

// Base Model
module.exports = Backbone.Model.extend({
	initialize: function initialize(options) {
		options = options || {}
		if(typeof options.url === undefined) {
			throw new Error('URL must be defined on model!')
		}
		this.url = options.url
	}
})