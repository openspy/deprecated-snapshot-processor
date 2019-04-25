var request = require('request-promise');
function PersistenStorage(options) {
}
PersistenStorage.prototype.UpdatePlayerKVStorage = function(profileid, gameid, persist_type, data_index, kv_data) {
    return new Promise(function(resolve, reject) {
        var kv_converted = {};
        var keys = Object.keys(kv_data);
        for(var i=0;i<keys.length;i++) {
            var data = kv_data[keys[i]];
            kv_converted[keys[i]] = Buffer.from(data.toString()).toString('base64');
        }
        var request_body = {profileLookup: {id: profileid}, dataIndex: data_index, persistType: persist_type,
         gameLookup: {id: gameid}, keyValueList: kv_converted};
       
        var headers = {'Content-Type': 'application/json', "APIKey": global.API_KEY};

        var options = {
            uri: global.API_ENDPOINT + "/v1/Persist/Storage/SetKVData",
            method: "POST",
            body: request_body,
            headers: headers,
            json: true
        };
        request.post(options).then(function(response) {
            resolve(response);
        }, reject)
    }.bind(this));
}
module.exports = PersistenStorage;