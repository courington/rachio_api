const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')


// oauth token
const headers = { 'headers': {'Authorization' :'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e'} }


// Base Model
const BaseModel = Backbone.Model.extend({
	initialize: function(options) {
		options = options || {}
		if(typeof options.url === undefined) {
			throw new Error('URL must be defined on model!')
		}
		this.url = options.url
	}
})


// Base Collection
const BaseCollection = Backbone.Collection.extend({})


// Base View
const BaseView = Backbone.View.extend({
	initialize: function(options) {
		options = options || {}
		this.model = options.model
		this.template = _.template(options.template)

		this.listenTo(this.model, 'request', function() {
			this.renderLoader();
		}, this)

		this.listenTo(this.model, 'sync', function() {
			this.render(this.model.toJSON())
		}, this)

		if(!this.model.length) {
			this.model.fetch(headers)
		} else {
			this.render(this.model.toJSON())
		}
	},

	render: function(data) {
		data = data || {}
		this.$el.html(this.template(data))
		
		if(this.$el.hasClass('loading')) {
			this.$el.removeClass('loading').addClass('loaded')
		}

		return this.$el
	},

	renderLoader: function() {
		this.$el.html('loading...');
	}
})


// List Widget
const ListWidget = Backbone.View.extend({
	events: {
		'click [data-zone]': 'setZoneState'
	},

	setZoneState: function(e) {
		e.preventDefault
		let id = e.currentTarget.dataset.zone
		console.warn(id)
	},

	initialize: function(options) {
		options = options || {}
		this.model = {}
		_.extend(this.model, {length: options.model.length, items: options.model})
		this.render()
	},

	render: function() {
		let template = _.template(`<ul><% _.each(items, function(item) { %>
			<li>
				<h3><%= item.name %></h3>
				<div data-deviceID="<%= item.id %>">
					<ul>
					<% _.each(item.zones, function(zone) { %>
						<li>
							<button type="button" data-zone="<%= zone.id %>"><%= zone.name %></button>
						</li>
					<% }) %>
					</ul>
				</div>
			</li>
			<% }) %></ul>`
		)
		this.$el.html(template(this.model))
		return this.$el
	}
})

// Main Controller
const BaseController = BaseView.extend({
	childModels: {},


	// set the user model based on the returned id from /user/info
	setUserModel: function() {
		let url = 'https://api.rach.io/1/public/person/'+ this.model.get('id')
		this.childModels.User = new BaseModel({
			url: url
		})
		this.renderMantel()
		this.setDevicesCollection()
	},


	// set the devices collection based off the devices attr retrieved off the user obj
	setDevicesCollection: function() {
		let deviceURL = 'https://api.rach.io/1/public/device'
		let zoneURL = 'https://api.rach.io/1/public/zone'
		let DeviceModel = Backbone.Model.extend({
			urlRoot: deviceURL,
		})
		let ZoneModel = Backbone.Model.extend({
			urlRoot: zoneURL
		})
		let ZonesCollection = BaseCollection.extend({
			model: ZoneModel
		})
		let DevicesCollection = BaseCollection.extend({
			initialize: function(models, options) {
				// map models to create a collection of zones fo each
				models.map(function(model) {
					model.zones = new ZonesCollection(model.zones)
				})
			},
			model: DeviceModel
		})
		this.listenToOnce(this.childModels.User, 'sync', function() {
			this.childModels.Devices = new DevicesCollection(this.childModels.User.get('devices'))
			this.renderDevices()
		}, this)
	},


	// render the app mantel
	renderMantel: function() {
		let topBar = new BaseView({
			el: $('#MainMantel').find('.greeting'),
			model: this.childModels.User,
			template: `Hello, <%= fullName %>`
		})
	},


	// render a list of all devices
	renderDevices: function() {
		let model = this.childModels.Devices.toJSON()
		model.map(function(model) {
			// put the zones in ascending order every time
			let sortedZones = _.sortBy(model.zones.toJSON(), 'zoneNumber')
			model.zones = sortedZones
		})
		let devicesListWidget = new ListWidget({
			el: $('#DevicesList'),
			model: model
		})
	}
})


// Start the App
$(document).ready(function() {

	let controllerTemplate = `<header id="MainMantel" class="MantelBar clearfix">
	    	<div>
	        	<h1 class="logo">Rachio</h1>
	        	<h2 class="greeting"></h2>
	    	</div>
		</header>
		<main id="MainContent">
			<div id="UserInfo"></div>
			<div id="DevicesList"></div>
		</main>`

	// start the app controller
	let mainController = new BaseController({
		el: $('body.loading'),
		model: new BaseModel({
			url: 'https://api.rach.io/1/public/person/info'
		}),
		template: controllerTemplate
	})

	// set the user model which is used to populate devices and zones collection
	mainController.listenToOnce(mainController.model, 'sync', function(){
		this.setUserModel()
	})
})
