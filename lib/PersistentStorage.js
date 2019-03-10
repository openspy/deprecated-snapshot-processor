var request = require('request-promise');
function PersistenStorage(options) {
}
PersistenStorage.prototype.UpdatePlayerKVStorage = function(profileid, gameid, persist_type, data_index, kv_data) {
    return new Promise(function(resolve, reject) {
        var request_body = {profileLookup: {id: profileid}, dataIndex: data_index, persistType: persist_type,
         gameLookup: {id: gameid}, keyValueList: kv_data};
       
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