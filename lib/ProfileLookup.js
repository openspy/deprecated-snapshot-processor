var request = require('request-promise');
function ProfileLookup(options) {
}
ProfileLookup.prototype.Lookup = function(lookupData) {
    return new Promise(function(resolve, reject) {

        var request_body = lookupData;
       
        var headers = {'Content-Type': 'application/json', "APIKey": global.API_KEY};

        var options = {
            uri: global.API_ENDPOINT + "/v1/Profile/lookup",
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

module.exports = ProfileLookup;