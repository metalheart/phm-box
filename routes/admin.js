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
    path = require('path'),
    fs = require('fs');

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
                        //JSON response will show all blobs in JSON format
                        json: function(){
                            res.json(devices);
                        }
                    });
                }
            });
    });

router.route('/test')
    .get(function(req, res, next) {

        //retrieve all blobs from Monogo

        //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
        res.format({
            //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
            html: function(){
                res.render('admin/test', {
                    title: 'All my tasks'
                });
            },
            //JSON response will show all blobs in JSON format
            json: function(){
                res.json(devices);
            }
        });
    });

router.route('/')
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
    console.log("task_list: " + req.query.id);
    mongoose.model('TaskSchedule').find({device:req.query.id})
        .populate('device')
        .populate('content')
        .exec(function (err, tasks) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                console.log("task_list response: " + tasks);
                filteredTasks = [];
                for (var i in tasks) {
                    var task = tasks[i];
                    if (fs.existsSync(path.join(__dirname, '../public/media/') + task.content.resource)) {
                        filteredTasks.push(task);
                    }
                }
                res.format({
                    json: function () {
                        res.json(filteredTasks);
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
        var _type = req.body.type;

        console.log('!!!creating task on ' + _date);

        mongoose.model('TaskSchedule').create({
            device: _device,
            scheduleDate: _date,
            content: _type == 'update' ? null :_content,
            type: _type
        }, function (err, task) {
            if (err) {
                throw err;
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

router.route('/delete_task')
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var _id = req.body.id;        

        mongoose.model('TaskSchedule').findById(_id, function(err, task) {
            if (err) {
                throw err;
            } else {
                //Blob has been created
                task.remove( function (err, task) {
                    res.format({
                        json: function(){
                            res.json(task);
                        }
                    });
                });
            }
        });
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
                throw err;
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
        var ext = path.extname(filename).toLowerCase();
        var encodedFilename = crypto.createHash('md5').update(path.posix.basename(filename)).digest("hex");
        var targetName = encodedFilename + ext;
        var targetPath = path.join(__dirname, '../public/media/') + targetName;

        var videoFormats = ['.mp4','.mkv','.avi','.asf','.mov','.qt','.flv','.swf','.webm', '.ogv', '.3gp'];
        var imageFormats = ['.jpg', '.png', '.gif'];

        var mediatype = 'application/json';
        if (videoFormats.indexOf(ext) > -1) {
            mediatype = 'video';
        } else if (imageFormats.indexOf(ext) > -1) {
            mediatype = 'image';
        }

        sampleFile.mv(targetPath, function(err) {
            if (err) {
                throw err;
            }
            else {
                console.log("Uploaded file stored at: " + targetPath);
                var content = mongoose.model('Content').create({
                    type: mediatype,
                    description: filename,
                    resource: targetName
                }, function (err, device) {
                    if (err) {
                        throw err;
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