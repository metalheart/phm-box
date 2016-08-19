/**
 * Created by metalheart on 15.08.2016.
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

router.route('/device_list')
    .get(function(req, res, next) {

        //retrieve all blobs from Monogo
        mongoose.model('Device').find({})
            .exec(function (err, devices) {
                if (err) {
                    return console.error(err);
                } else {
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                        html: function(){
                            res.render('admin/index', {
                                title: 'All my tasks',
                                "devices" : devices
                            });
                        },
                        //JSON response will show all blobs in JSON format
                        json: function(){
                            res.json(devices);
                        }
                    });
                }
            });
    });

router.route('/')
    .get(function(req, res, next) {
        /*
        mongoose.model('Device').create({
            description: 'device for test',
            tags:'test',
            serial: '12345'
        });*/

        //retrieve all blobs from Monogo
        mongoose.model('Device').find({})
            .exec(function (err, devices) {
                if (err) {
                    return console.error(err);
                } else {
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                        html: function(){
                            res.render('admin/index', {
                                title: 'All my tasks',
                                "devices" : devices
                            });
                        },
                        //JSON response will show all blobs in JSON format
                        json: function(){
                            res.json(devices);
                        }
                    });
                }
        });
    });

router.route('/content_list').get( function (req, res, next) {
    mongoose.model('Content').find({})
        .exec(function (err, content) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    json: function () {
                        res.json(content);
                    }
                });
            }
        });
});

router.route('/task_list').get( function (req, res, next) {
    mongoose.model('TaskSchedule').find({device:req.query.id})
        .populate('device')
        .populate('content')
        .exec(function (err, tasks) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    json: function () {
                        res.json(tasks);
                    }
                });
            }
        });
});

router.route('/add_task')
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var _device = req.body.device;
        var _date = req.body.date;
        var _content = req.body.content;

        mongoose.model('TaskSchedule').create({
            device: _device,
            date: _date,
            content: _content,
            type: "schedule"
        }, function (err, task) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Blob has been created
                console.log('POST creating new device: ' + task);
                res.format({
                    json: function(){
                        res.json(task);
                    }
                });
            }
        })
    });

router.route('/new_device')
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var description = req.body.description;
        var sn = req.body.serial;
        var taglist = req.body.tags;

        mongoose.model('Device').create({
            serial: sn,
            description: description,
            tags: taglist
        }, function (err, device) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Blob has been created
                console.log('POST creating new device: ' + device);
                res.format({
                    json: function(){
                        res.json(device);
                    }
                });
            }
        })
    });

router.route('/upload')
    .post(function(req, res) {
        var sampleFile;

        if (!req.files) {
            res.send('No files were uploaded.');
            return;
        }

        sampleFile = req.files.file;
        var filename = sampleFile.name;
        var encodedFilename = crypto.createHash('md5').update(path.posix.basename(filename)).digest("hex");
        var targetPath = path.join(__dirname, '../public/media/') + encodedFilename + path.extname(filename);

        sampleFile.mv(targetPath, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                var content = mongoose.model('Content').create({
                    type: "image",
                    resource: sampleFile.name
                }, function (err, device) {
                    if (err) {
                        console.log("Failed to create content item!")
                    } else {
                        res.location("admin");
                        res.redirect("/admin");
                    }
                });
            }
        });
    });


        /*mongoose.model('Device').create({
            serial: sn,
            description: description,
            tags: taglist
        }, function (err, device) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Blob has been created
                console.log('POST creating new device: ' + device);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("admin");
                        // And forward to success page
                        res.redirect("/admin");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(device);
                    }
                });
            }
        })*/

/*
router.route('/new')
    .get(function(req, res, next) {
        //retrieve all blobs from Monogo
        mongoose.model('Device').find({})
            .exec(function (err, devices) {
                if (err) {
                    return console.error(err);
                } else {
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                        html: function(){
                            res.render('admin/new_task', {
                                title: 'All my tasks',
                                "devices" : devices,
                                "taskTypes" : ['schedule', 'sleep', 'restart']
                            });
                        },
                        //JSON response will show all blobs in JSON format
                        json: function(){
                            res.json(devices);
                        }
                    });
                }
            });
    });

router.route('/new_group')
    .get(function(req, res, next) {//respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
        res.format({
            //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
            html: function(){
                res.render('admin/new_group', {
                    title: 'All my tasks'
                });
            }
        });
    })
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var description = req.body.description;

        mongoose.model('Group').create({
            parent: null,
            description : description
        }, function (err, group) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Blob has been created
                console.log('POST creating new device: ' + group);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("tasks");
                        // And forward to success page
                        res.redirect("/tasks");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(group);
                    }
                });
            }
        })
    });

router.route('/new_device')
    .get(function(req, res, next) {//respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
        mongoose.model('Group').find({})
            .exec(function (err, groups) {
                res.format({
                                //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                                html: function(){
                                    res.render('admin/new_device', {
                                        title: 'All my tasks',
                                        groups: groups
                                    });
                                }
                            });
                })
    })
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var description = req.body.description;
        var sn = req.body.serial;
        var groupId = req.body.group;

        mongoose.model('Device').create({
            group: groupId,
            serial : sn,
            description : description
        }, function (err, device) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Blob has been created
                console.log('POST creating new device: ' + device);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("tasks");
                        // And forward to success page
                        res.redirect("/tasks");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(device);
                    }
                });
            }
        })
    });
*/
module.exports = router;