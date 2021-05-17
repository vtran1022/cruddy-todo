const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');

var items = {};

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {
  counter.getNextUniqueId((err, data) => {
    var todoFile = path.join(exports.dataDir, `${data}.txt`);
    fs.writeFile(todoFile, text, (err) => {
      if (err) {
        throw (`error writing file: ${err}`);
      } else {
        items[data] = text;
        callback(null, {id: data, text: text});
      }
    });
  });
};

exports.readAll = (callback) => {
  var data = _.map(items, (text, id) => {
    return { id, text };
  });
  callback(null, data);
};

/*
i: cb func
o: an array of todos (sent to client via GET request)
c: 1) VERY IMPORTANT: at this point in the basic requirements, do not attempt to read the contents of each file that contains the todo item text. Failing to heed this instruction has the potential to send you down a rabbit hole.
  2) must still include a text field in your response to the client, and it's recommended that you use the message's id (that you identified from the filename) for both the id field and the text field.
e: should return an empty array if no todos
*/

exports.readOne = (id, callback) => {
  var text = items[id];
  if (!text) {
    callback(new Error(`No item with id: ${id}`));
  } else {
    callback(null, { id, text });
  }
};

/*
to read one todo item when a GET request is made - finds the corresponding file in the dataDir to read
i: id = string, callback (err, data)
o: will read one todo item from the dataDirc and then the callback is called on it
c: none
e: none
*/

exports.update = (id, text, callback) => {
  var item = items[id];
  if (!item) {
    callback(new Error(`No item with id: ${id}`));
  } else {
    items[id] = text;
    callback(null, { id, text });
  }
};

exports.delete = (id, callback) => {
  var item = items[id];
  delete items[id];
  if (!item) {
    // report an error if item not found
    callback(new Error(`No item with id: ${id}`));
  } else {
    callback();
  }
};

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
