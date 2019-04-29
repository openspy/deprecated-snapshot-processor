var request = require('request-promise');
global.profileCache = {};
function ProfileLookup(options) {
    
}
ProfileLookup.prototype.Lookup = function(lookupData) {
    return new Promise(function(resolve, reject) {

        if(lookupData.id) {
            if(global.profileCache[lookupData.id]) {
                return resolve([global.profileCache[lookupData.id]]);
            }
        }

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
            for(var i=0;i<response.length;i++) {
                global.profileCache[response[i].id] = response[i];
            }
            resolve(response);
        }.bind(this), reject)
    }.bind(this));
}

module.exports = ProfileLookup;