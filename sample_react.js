// JS to control UI for getting/setting device zone(s)
const $ = require('jquery')
const React = require('react')
const ReactDOM = require('react-dom')

// let token = {'Authorization' :'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e'}
let urlRoot = 'https://api.rach.io/1/public/person/61b28ce9-7bc1-47cc-9b85-98b6bebf8951'

// 	$.ajax({
// 		url: urlRoot,
// 		type: 'GET',
// 		dataType: 'json',
// 		cache: false,
// 		beforeSend: function(xhr) {
// 		    xhr.setRequestHeader('Authorization', 'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e');
// 		},
// 		done: function(data) {
// 			this.setState({data: data});
// 		}.bind(this),
// 		fail: function(xhr, status, err) {
// 			console.error(url, status, err.toString());
// 		}.bind(this)
// 	})
// 	.done(function(data) {
// 		console.warn(data)
// 	});

// });

let CommentBox = React.createClass({
	getInitialState: function() {
		return {data: []};
	},
	loadCommentsFromServer: function() {
		$.ajax({
			url: urlRoot,
			type: 'GET',
			dataType: 'json',
			cache: false,
			beforeSend: function(xhr) {
		    	xhr.setRequestHeader('Authorization', 'Bearer c3667b81-92a6-4913-b83c-64cc713cbc1e');
			},
			success: function(data) {
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	componentDidMount: function() {
		this.loadCommentsFromServer();
		// setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function() {
		return (
			<div className="commentBox">
				<h1>Comments</h1>
				<CommentList data={this.state.data}/>
				<CommentForm/>
			</div>
		);
	}
});

let CommentList = React.createClass({
  render: function() {
  	// var commentNodes = this.props.data.map(function(comment) {
   //    return (
   //      <Comment author={comment.author} key={comment.id}>
   //        {comment.text}
   //      </Comment>
   //    );
   //  });
    return (
      <div className="commentList">
      	<Comment fullName={this.props.data.fullName}/>
      </div>
    );
  }
});

let CommentForm = React.createClass({
  render: function() {
    return (
      <div className="commentForm">
        Hello, world! I am a CommentForm.
      </div>
    );
  }
});

let Comment = React.createClass({
  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.fullName}
        </h2>
      </div>
    );
  }
});

ReactDOM.render(
	<CommentBox data="/api/user" pollInterval={2000}/>,
	document.getElementById('Content')
);