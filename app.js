// JS to control UI for getting/setting device zone(s)
const $ = require('jquery')
const React = require('react')
const ReactDOM = require('react-dom')

let token = {'Authorization' :'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e'}
let urlRoot = 'https://api.rach.io/1/public/person/61b28ce9-7bc1-47cc-9b85-98b6bebf8951'

let ControlBox = React.createClass({
	render: function() {
		return (
			<div className="controlBox">
				Hello, world! I am a ControlBox.
			</div>
		);
	}
});

ReactDOM.render(
	<ControlBox />,
	document.getElementById('Content')
);