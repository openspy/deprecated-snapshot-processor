const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

function DbCtx() {
    this.url = 'mongodb://10.1.1.125:27017';


}
DbCtx.prototype.connect = function() {
  return new Promise(function(resolve, reject) {
    if(this.connected) return resolve(this.connected);
    // Use connect method to connect to the server
    MongoClient.connect(this.url, {useNewUrlParser: true}, function(err, client) {
      assert.equal(null, err);

      this.connection_error = err;
      this.client = client;
      this.connected = !err;
      resolve(this.connected);
    }.bind(this));
  }.bind(this))
}
DbCtx.prototype.getDatabaseCtx = function() {
  return new Promise(function(resolve, reject) {
    if(!this.connected) {
      return this.connect().then(function(success) {
        resolve(this.client);
      }.bind(this), reject);
    } else {
      return resolve(this.client);
    }    
  }.bind(this));
}
module.exports = DbCtx;