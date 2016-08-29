var ListViewHelper = function() {
    this.content = null;
    this.list = null;
    this.listCb = function() {}
    this.view = null;
    this.viewCb = function() {}
};

ListViewHelper.prototype.init = function(data) {
    this.content = data.content;
    this.list =  data.list.contents();
    this.listCb = data.listCb;
    this.view =  data.view.contents();
    this.viewCb = data.viewCb;
};

ListViewHelper.prototype.setList = function(where, data) {
    for (var i in data) {
        device = data[i]

        var item = this.list.clone();
        item.data(device);

        for (var j in device) {
            if (device.hasOwnProperty(j)) {
                var idStr = '#' + j;

                if (item.find(idStr).length) {
                    item.find(idStr).html(device[j]);
                }
            }
        }

        where.append(item);
    }

    this.listCb(where, data);
};

ListViewHelper.prototype.setView = function(where, data) {
    var item = this.view.clone();

    for (var j in data) {
        if (data.hasOwnProperty(j)) {
            var idStr = '#' + j;

            if (item.find(idStr).length) {
                item.find(idStr).html(data[j]);
            }
        }
    }

    where.html('');
    where.append(item);

    this.viewCb(where, data);
};