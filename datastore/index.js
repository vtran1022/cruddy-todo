const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');
const Promise = require('bluebird');
const promisefs = Promise.promisifyAll(fs);

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {
  counter.getNextUniqueId((err, id) => {
    if (err) {
      return callback(err);
    }
    var todoFile = path.join(exports.dataDir, `${id}.txt`);
    fs.writeFile(todoFile, text, (err) => {
      if (err) {
        callback(new Error(`error writing file: ${err}`));
      } else {
        callback(null, {id: id, text: text});
      }
    });
  });
};

exports.readAll = (callback) => {
  return promisefs.readdirAsync(exports.dataDir)
    .then((files) => {
      var todoFiles = files.map((file) => {
        var id = file.slice(0, 5);
        var filePath = path.join(exports.dataDir, file);
        return promisefs.readFileAsync(filePath)
          .then((fileData) => {
            return {id: id, text: fileData.toString()};
          });
      });
      Promise.all(todoFiles)
        .then((todoFile) => {
          callback(null, todoFile);
        });
    })
    .catch((err) => {
      callback(err);
    });
};

/* data: [ '00001.txt', '00002.txt', '00003.txt', '00004.txt', '00005.txt' ]
inside data: an element = '00001.txt'


-prior to promises refactor
  fs.readdir(exports.dataDir, (err, data) => {
    if (err) {
      throw (`error reading directory: ${err}`);
    } else {
        var mappedData = _.map(data, (element) => {
        return {id: element.slice(0, 5), text: element.slice(0, 5)};
      });
      callback(null, mappedData);
    }

- in solution video
  fs.readdir(exports.dataDir, (err, files) => {
    if (err) {
      return callback(err);
    } else {
        var mappedData = _.map(files, (file) => {
          var id = path.basename(file, '.txt');
          var filepath = path.join(exports.dataDir, file)
          fs.readFile(filepath, (fileData) => {
            return {id: id, text: fileData} -- this is problematic b/c many async funcs running
          })
      });
      callback(null, mappedData);
    }

- solu video w/ promises
  fs.readdir(exports.dataDir, (err, files) => {
    if (err) {
      return callback(err);
    } else {
        var mappedData = _.map(files, (file) => {
          var id = path.basename(file, '.txt');
          var filepath = path.join(exports.dataDir, file)
          return readFilePromise(filepath)
            .then((fileData) => {
              return {id: id, text:fileData.toString()}
            };
          });
      });
      Promise.all(data)
        .then((items) => {
          callback(null, items);
        })
    }

i: cb func
o: an array of todos (sent to client via GET request)
c: 1) VERY IMPORTANT: at this point in the basic requirements, do not attempt to read the contents of each file that contains the todo item text. Failing to heed this instruction has the potential to send you down a rabbit hole.
  2) must still include a text field in your response to the client, and it's recommended that you use the message's id (that you identified from the filename) for both the id field and the text field.
e: should return an empty array if no todos

fs has a readdir func(file, callback(err, data))
*/

exports.readOne = (id, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(new Error(`No item with id: ${id}`));
    } else {
      callback(null, {id: id, text: data.toString()});
    }
  });
};

/*
data: <Buffer 52 52>
*/

/*
to read one todo item when a GET request is made - finds the corresponding file in the dataDir to read
i: id = string, callback (err, data)
o: will read one todo item from the dataDirc and then the callback is called on it
c: none
e: none

fs.readFile can be used here
*/

exports.update = (id, text, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(new Error(`No item with id: ${id}`));
    } else {
      fs.writeFile(filePath, text, (err) => {
        if (err) {
          throw (`error updating file: ${err}`);
        } else {
          callback(null, {id: id, text: text});
        }
      });
    }
  });
};

/*
PUT request - looks up the corresponding file, adjusts it per the next text, then does a callback on it (prob use writeFile)
i: id = string, text = string, callback(err, data)
o: updated txt file
c: none
e: if file does not exist then return an error

need to access the file contents somehow then fs.writeFile to 'write over' the contents inside
*/

exports.delete = (id, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(new Error(`No item with id: ${id}`));
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          throw (`error deleting file: ${err}`);
        } else {
          callback();
        }
      });
    }
  });
};

/*
  var item = items[id];
  delete items[id];
  if (!item) {
    // report an error if item not found
    callback(new Error(`No item with id: ${id}`));
  } else {
    callback();
  }
*/

/*
DELETE request - looks up corresponding file and delete the file
i: id = string, callback(err, data)
o: none
c: none
e: if file does not exist, return an error

need to access the file then remove it from dataDir
*/

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
