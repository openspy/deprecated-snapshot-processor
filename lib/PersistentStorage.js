var request = require('request-promise');
function PersistenStorage(options) {
}
PersistenStorage.prototype.UpdatePlayerKVStorage = function(profileid, gameid, persist_type, data_index, kv_data) {
    return new Promise(function(resolve, reject) {
        var request_body = {"mode": "set_persist_data", profileid, data_index, data_type: persist_type, "kv_set": true, game_id: gameid, keyList: kv_data};
       
        var headers = {'Content-Type': 'application/json', "APIKey": global.API_KEY};

        var options = {
            uri: global.API_ENDPOINT + "/backend/persist",
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