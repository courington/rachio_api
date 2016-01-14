const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')

// List Widget
module.exports = Backbone.View.extend({
	events: {
		'click [data-zone]': 'startZone',
		'click [data-device]': 'startZones',
	},

	startZones: function startZones(e) {
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

		Backbone.sync('update', this.zonesCollection, options)
	},

	// start a single zone
	startZone: function startZone(e) {
		e.preventDefault
		let zoneID = e.currentTarget.dataset.zone
		console.warn(this.zonesModel)
		// let zone = this.zonesModel.get(zoneID)
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
		// zone.urlStartOne()
		// zone.save(zone, options)
	},

	initialize: function initialize(options) {
		options = options || {}
		if(options.zonesModel) {
			this.zonesModel = options.zonesModel
		}

		this.render()
	},

	render: function render() {
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