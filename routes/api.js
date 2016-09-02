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

function date2ts(date) {
    if (date == null) {
        return -1;
    } else {
        return date.getTime() / 1000;
    }
}

router.route('/')
	.get(function(req, res, next) {
        var params = req.query;

		var deviceUID = params.serial;

		var lastTimeStamp = params.payload.last_ts;

        var trashbin = params.payload.trashbin;

        var temperature = params.payload.temperature;
        var light = params.payload.light;
        var humidity = params.payload.humidity;
        var phoneNumber = params.payload.phone_number;
        var imei = params.payload.imei;
        var balance = params.payload.balance;

        //retrieve all blobs from Monogo
        mongoose.model('Device').findOne({serial: deviceUID})        
            .exec(function (err, device) {
                if (err) {
                    return console.error(err);
                } else {
                    if (device == null) { //new device - insert new device into db
                        mongoose.model('Device').create({
                            serial: deviceUID,
                            description: 'new device'
                        }, function (err, device) {
                            if (err) {
                                res.send("There was a problem adding the information to the database.");
                            } else {
                                //Blob has been created
                                console.log('POST creating new device: ' + device);
                                res.format({
                                    json: function(){
                                        res.json({});
                                    }
                                });
                            }
                        });
                    } else {
                        for (var i in trashbin)
                        {
                            trash = trashbin[i];
                            mongoose.model('TaskSchedule').findByIdAndRemove(trash, function(err) {
                                if (err) throw err;
                                console.log('Task deleted!');
                            });
                        }
                        mongoose.model('TaskSchedule').find({device: device._id})
                        .where('updatedAt').gt(new Date(lastTimeStamp*1000))         
                        .populate('content')                
                        .exec(function (err, tasks) {
                            if (err) {
                                res.send("There was a problem adding the information to the database.");
                            } else {
                                var payloadData = [];
                                for(var i in tasks)
                                {
                                    var item = tasks[i];
                                    payloadData.push({id: item._id, type: item.type, date: date2ts(item.scheduleDate), task_ts: date2ts(item.updatedAt), content_type: item.content.type, resource: item.content.resource});
                                }

                                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                                res.format({
                                    json: function(){
                                        res.json({type: "tasks", payload: payloadData});
                                    }
                                });

                                device.lastSeen = new Date();
                                
                                device.temperature = temperature;                                
                                device.light = light;
                                device.humidity = humidity;
                                device.phoneNumber = phoneNumber;
                                device.imei = imei;
                                device.balance = balance;
                                device.save(function(err) {
                                    if (err) throw err;
                                });
                            }
                        });
                    }
                }
            });
    })
    .post(function(req, res, next) {
        var params = req.body;

		var deviceUID = params.serial;

		var lastTimeStamp = params.payload.last_ts;

        var trashbin = params.payload.trashbin;

        var temperature = params.payload.temperature;
        var light = params.payload.light;
        var humidity = params.payload.humidity;
        var phoneNumber = params.payload.phone_number;
        var imei = params.payload.imei;
        var balance = params.payload.balance;

        //retrieve all blobs from Monogo
        mongoose.model('Device').findOne({serial: deviceUID})        
            .exec(function (err, device) {
                if (err) {
                    return console.error(err);
                } else {
                    if (device == null) { //new device - insert new device into db
                        mongoose.model('Device').create({
                            serial: deviceUID,
                            description: 'new device'
                        }, function (err, device) {
                            if (err) {
                                res.send("There was a problem adding the information to the database.");
                            } else {
                                //Blob has been created
                                console.log('POST creating new device: ' + device);
                                res.format({
                                    json: function(){
                                        res.json({});
                                    }
                                });
                            }
                        });
                    } else {
                        for (var i in trashbin)
                        {
                            trash = trashbin[i];
                            mongoose.model('TaskSchedule').findByIdAndRemove(trash, function(err) {
                                if (err) throw err;
                                console.log('Task deleted!');
                            });
                        }
                        mongoose.model('TaskSchedule').find({device: device._id})
                        .where('updatedAt').gt(new Date(lastTimeStamp*1000))         
                        .populate('content')                
                        .exec(function (err, tasks) {
                            if (err) {
                                res.send("There was a problem adding the information to the database.");
                            } else {
                                var payloadData = [];
                                for(var i in tasks)
                                {
                                    var item = tasks[i];
                                    contentType = item.content ? item.content.type : '';
                                    resource = item.content ? item.content.resource : '';
                                    payloadData.push({id: item._id, type: item.type, date: date2ts(item.scheduleDate), task_ts: date2ts(item.updatedAt), content_type: contentType, resource: resource});
                                }

                                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                                res.format({
                                    json: function(){
                                        res.json({type: "tasks", payload: payloadData});
                                    }
                                });

                                device.lastSeen = new Date();
                                
                                device.temperature = temperature;                                
                                device.light = light;
                                device.humidity = humidity;
                                device.phoneNumber = phoneNumber;
                                device.imei = imei;
                                device.balance = balance;
                                device.save(function(err) {
                                    if (err) throw err;
                                });
                            }
                        });
                    }
                }
            });
    });

module.exports = router;