const $ = require('jquery')
const Backbone = require('backbone')
const _ = require('lodash')

// List Widget
module.exports = Backbone.View.extend({
	events: {
		'click [data-zone]': 'startZone',
		'click [data-device]': 'startZones',
	},

	// standardize the ajax call
	sendStart: function sendStart(url, data, el) {

		console.warn(el);

		$.ajax({
			url: url,
			type: 'PUT',
			data: data,
			dataType: 'json',
			statusCode: {
		    	204: function() {
		    		console.warn('success!');
		    	}
		    },
			beforeSend: function(xhr) {
				$(el).addClass('working');
				xhr.setRequestHeader('Authorization', 'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e');
			}
		})
		.done(function(data, status) {
			console.warn(status);
			$(el).removeClass('working');
		})
		.fail(function(xhr, status, err) {
			console.error(url, status, err.toString());
		});
	},

	// start all zones
	startZones: function startZones(e) {
		e.preventDefault
		
		let self = this,
			data = {"zones": []},
			deviceID = e.currentTarget.dataset.device,
			defaultRuntime = 60,
			// TODO: api only accepts a number, input value type set to number
			duration = e.currentTarget.previousElementSibling.value ? Number(e.currentTarget.previousElementSibling.value) : defaultRuntime;

		this.model.get(deviceID).toJSON().zones.map(function(zone) {
			data.zones.push({
				"id": zone.id,
				"duration": zone.lastWateredDuration || zone.runTime, // use last watered duration or use the set runtime of the zone
				"sortOrder": zone.zoneNumber
			})
		})

		this.sendStart(
			'https://api.rach.io/1/public/zone/start_multiple',
			JSON.stringify(data),
			e.currentTarget
		);
	},

	// start a single zone
	startZone: function startZone(e) {
		e.preventDefault
		let zoneID = e.currentTarget.dataset.zone,
			zone = _.findWhere(this.zonesModel.attributes, {id: zoneID}),
			defaultRuntime = 60,
			// TODO: input type=number value is being sent as a string, forcing to Number type, code-smell
			duration = e.currentTarget.previousElementSibling.value ? Number(e.currentTarget.previousElementSibling.value) : defaultRuntime;

		this.sendStart(
			'https://api.rach.io/1/public/zone/start',
			JSON.stringify({ "id" : zoneID, "duration" : duration })
		);
	},

	initialize: function initialize(options) {
		options = options || {}
		this.headers = options.headers || null
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