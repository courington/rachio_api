const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')
const moment = require('moment')


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
		'click [data-zone]': 'startZone',
		'click [data-device]': 'startZones',
	},

	startZones: function(e) {
		e.preventDefault
		
		let self = this
		let deviceID = e.currentTarget.dataset.device
		let defaultRuntime = 60
		
		// TODO: input type=number value is being sent as a string, forcing to Number type, code-smell
		let duration = e.currentTarget.previousElementSibling.value ? Number(e.currentTarget.previousElementSibling.value) : defaultRuntime

		// extend our oauth header with callbacks
		let options = _.extend(headers, {
			success: function(model, response, options) {
				console.warn(`Device ${deviceID} zones running!`)
			},
			error: function(model, response, options) {
				console.warn(`Error running Device ${deviceID} zones!`)
			}
		})

		this.zonesModel.map(function(zone) {
			zone.set({duration: duration, sortOrder: zone.get('zoneNumber')})
		})

		// TODO: this is breaking, need to re-send model rather than create a new model
		// -- this needs to be done with the childModels.Zones collection but the data
		// -- needs to be massaged to match the public api expectations
		let model = new BaseModel({
			url: 'https://api.rach.io/1/public/zone/start_multiple',
			zones: this.zonesModel.toJSON()
		})

		Backbone.sync('update', model, options)
	},

	// start a single zone
	startZone: function(e) {
		e.preventDefault
		let zoneID = e.currentTarget.dataset.zone
		let zone = this.zonesModel.get(zoneID)
		let defaultRuntime = 60
		// TODO: input type=number value is being sent as a string, forcing to Number type, code-smell
		let duration = e.currentTarget.previousElementSibling.value ? Number(e.currentTarget.previousElementSibling.value) : defaultRuntime

		// extend our oauth header with callbacks
		let options = _.extend(headers, {
			success: function(model, response, options) {
				console.warn(`Zone ${zoneID} is running!`)
			},
			error: function(model, response, options) {
				console.warn(`Error running ${zoneID}!`)
			}
		})

		// reset the zone model url to conform to api call .../zone/start
		// TODO: why does api not follow convention of /devices/:device_id/zones/:zone_id/start?duration=:duration
		zone.urlStart()
		
		zone.save({duration: duration}, options)
	},

	initialize: function(options) {
		options = options || {}
		if(options.zonesModel) {
			this.zonesModel = options.zonesModel
		}

		this.render()
	},

	render: function() {
		let data = {
			items: this.model.toJSON()
		}
		let template = _.template(`<ul class="list--unstyled"><% _.each(items, function(item) { %>
			<li>
				<strong data-device="<%= item.id %>"><%= item.name %></strong>
				<form class="input-group">
					<input type="number" name="duration"/>
					<button type="button" data-device="<%= item.id %>">Run All Zones!</button>
				</form>
				<% if(item.zones){ %>
					<dl>
					<dt>Device Zones:</dt>
					<% _.each(_.sortBy(item.zones, 'zoneNumber'), function(zone) { %>
						<dd>
							<div><%= zone.name %></div>
							<form class="input-group">
								<input type="number" name="duration" placeholder="<%= zone.runtime %>"/>
								<button type="button" data-zone="<%= zone.id %>">Run Zone!</button>
							</form>
						</dd>
					<% }) %>
					</dl>
				<% } %>
			</li>
			<% }) %></ul>`
		)
		this.$el.html(template(data))
		return this.$el
	}
})


// Main Controller
const BaseController = BaseView.extend({
	
	// child models for user, devices, zones
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
		let self = this
		let deviceURL = 'https://api.rach.io/1/public/device'
		let DeviceModel = Backbone.Model.extend({
			urlRoot: deviceURL,
		})
		let DevicesCollection = BaseCollection.extend({
			initialize: function(models, options) {
				// map each device model to create associated zones collection
				models.map(function(model) {
					// pass an object literal containing the device id and the zones to
					// create a standalone zones collection for ease in finding in updating individual zones
					self.setZonesCollection(_.extend({deviceID: model.id}, {zones: model.zones}))
				})
			},
			model: DeviceModel
		})
		this.listenToOnce(this.childModels.User, 'sync', function() {
			this.childModels.Devices = new DevicesCollection(this.childModels.User.get('devices'))
			this.renderDevices()
		}, this)
	},


	// set devices' zones collection
	// TODO: test against multiple devices for a single user
	setZonesCollection: function(options) {
		options = options || {}
		let zones = [] // empty array we'll be populating with our massaged zones
		let zoneURL = 'https://api.rach.io/1/public/zone'
		let ZoneModel = Backbone.Model.extend({
			urlRoot: zoneURL,
			urlStart: function() {
				return this.url = 'https://api.rach.io/1/public/zone/start'
			}
		})
		let ZonesCollection = BaseCollection.extend({
			model: ZoneModel,
			comparator: 'zoneNumber'
		})

		// check that the deviceID && zones attributes are set and zones is an array
		// TODO: double check code smell, maybe try...catch
		if(options.deviceID && options.zones && options.zones.__proto__.constructor === Array) {
			options.zones.map(function(zone) {
				zones.push(_.extend(zone, {deviceID: options.deviceID}))
			})
		}

		this.childModels.Zones = new ZonesCollection(zones)
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
		let devicesListWidget = new ListWidget({
			el: $('#DevicesList'),
			model: this.childModels.Devices,
			zonesModel: this.childModels.Zones
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
