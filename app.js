const $ = require('jquery')
const _ = require('lodash')
const Backbone = require('backbone')
const BaseView = require('./src/js/v.BaseView')
const BaseModel = require('./src/js/m.BaseModel')
const ListWidget = require('./src/js/v.ListWidget')

// oauth token
const headers = { 'headers': {'Authorization' :'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e'} }


// Main Controller
const BaseController = BaseView.extend({
	
	// child models for user, devices, zones
	childModels: {},

	// set the user model based on the returned id from /user/info
	setUserModel: function setUserModel() {
		let url = 'https://api.rach.io/1/public/person/'+ this.model.get('id')
		this.childModels.User = new BaseModel({
			url: url
		})
		this.renderMantel()
		this.setDevicesCollection()
	},


	// set the devices collection based off the devices attr retrieved off the user obj
	setDevicesCollection: function setDevicesCollection() {
		let self = this
		let deviceURL = 'https://api.rach.io/1/public/device'
		let DeviceModel = Backbone.Model.extend({
			urlRoot: deviceURL,
		})
		let DevicesCollection = Backbone.Collection.extend({
			initialize: function(models, options) {
				// map each device model to create associated zones collection
				models.map(function(model) {
					// pass an object literal containing the device id and the zones to
					// create a standalone zones collection for ease in finding in updating individual zones
					self.setZonesCollection({deviceID: model.id, zones: model.zones})
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
	setZonesCollection: function setZonesCollection(options) {
		options = options || {}
		let zones = []
		// check that the deviceID && zones attributes are set and zones is an array
		// TODO: double check code smell, maybe try...catch
		if(options.deviceID && options.zones && options.zones.__proto__.constructor === Array) {
			options.zones.map(function(zone) {
				zones.push(_.extend(zone, {deviceID: options.deviceID}))
			})
		} else {
			throw Error('Missing params!')
		}
		
		// let ZoneModel = Backbone.Model.extend({
		// 	urlRoot: zoneURL,
		// 	urlStart: function() {
		// 		return this.url = 'https://api.rach.io/1/public/zone/start'
		// 	}
		// })

		let ZonesCollection = Backbone.Model.extend({
			urlRoot: 'https://api.rach.io/1/public/zone',
			urlStartOne: function urlStartOne() {
				return this.url = this.url + '/start'
			},
			urlStartAll: function urlStartOne() {
				return this.url = this.url + '/start_multiple'
			},
			toServerJSON: function toServerJSON(options) {
				options = options || {}
				let duration
				if(options.duration) {
					duration = options.duration
				}
				let attrs = {
					zones: _.clone(this.toJSON())
				}
				attrs.zones.map(function(model) {
					model.sortOrder = model.zoneNumber
					model.duration = duration
				})
				return attrs
			}
		})

		this.childModels.Zones = new ZonesCollection(zones)
	},


	// render the app mantel
	renderMantel: function renderMantel() {
		let topBar = new BaseView({
			el: $('#MainMantel').find('.greeting'),
			model: this.childModels.User,
			template: `Hello, <%= fullName %>`,
			headers: this.headers
		})
	},


	// render a list of all devices and their zones
	renderDevices: function renderDevices() {
		let devicesListWidget = new ListWidget({
			el: $('#DevicesList'),
			model: this.childModels.Devices,
			zonesModel: this.childModels.Zones,
			headers: this.headers
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
			<div id="DevicesList"></div>
		</main>`

	// start the app controller
	let mainController = new BaseController({
		el: $('body.loading'),
		model: new BaseModel({
			url: 'https://api.rach.io/1/public/person/info'
		}),
		template: controllerTemplate,
		headers: headers
	})

	// set the user model which is used to populate devices and zones collection
	mainController.listenToOnce(mainController.model, 'sync', function(){
		mainController.setUserModel()
	})
})
