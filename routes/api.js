/**
 * Created by metalheart on 17.08.2016.
 */
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    db = require('../model/db'),
    crypto = require('crypto'),
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    fileUpload = require('express-fileupload'),
    path = require('path');

router.use(fileUpload());

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

router.route('/')
	.get(function(req, res, next) {
		var deviceId = req.query.id;
		
        //retrieve all blobs from Monogo
        mongoose.model('TaskSchedule').find(/*{device: deviceId}*/)
			.populate("device")
			.populate("content")
            .exec(function (err, tasks) {
                if (err) {
                    return console.error(err);
                } else {
					var payloadData = [];
					for(var i in tasks)
					{
						var task = tasks[i];
						payloadData.push({id: task.id_, type: task.type, date: task.date, content_type: task.content.type, resource: task.content.resource});
					}
					
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        json: function(){
                            res.json({type: "tasks", payload: payloadData});
                        }
                    });
                }
            });
    })
    .post(function(req, res, next) {
		var deviceId = req.body.id;
		
        //retrieve all blobs from Monogo
        mongoose.model('TaskSchedule').find({device: deviceId})
			.populate("device")
			.populate("content")
            .exec(function (err, tasks) {
                if (err) {
                    return console.error(err);
                } else {
					var payloadData = [];
					for(var i in tasks)
					{
						var task = tasks[i];
						payloadData.push({id: task.id_, type: task.type, date: task.date, content_type: task.content.type, resource: task.content.resource});
					}
					
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        json: function(){
                            res.json({type: "tasks", payload: payloadData});
                        }
                    });
                }
            });
    });

module.exports = router;