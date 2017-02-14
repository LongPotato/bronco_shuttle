'use strict';
var request = require('request');
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2"
});

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin" : "*"
    },
    body: JSON.stringify({
      message: 'Wait time has been updated!'
    }),
  };

  fetchWaitingtimes();
  callback(null, response);
};

module.exports.queryWaitTime = (event, context, callback) => {

  queryWaitingtime(callback);

};

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "bus_tracking";

function fetchWaitingtimes() {
  request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        // console.log(body);
         var item = JSON.parse(body);
          for(var i = 0; i < item.length; i++) {
              putItem(item[i]);
          }
      }
    })
}

function putItem(item) {
  var params = {
    TableName:table,
    Item:{
      "id": item.id,
      "timestamp": Date.now(),
      "logo": item.logo,
      "lat": item.lat,
      "lng": item.lng,
      "route": item.route
    }
  };

  console.log("Adding a new item...");
  docClient.put(params, function(err, data) {
    if (err) {
      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Added item:", JSON.stringify(data, null, 2));
    }
  });
}



function queryWaitingtime(callback) {
  var params = {
    TableName : table,
    //KeyConditionExpression: "#key = :inputName",
    //ExpressionAttributeNames:{
    //  "#key": "rideName"
    //},
    //ExpressionAttributeValues: {
    //  ":inputName":rideName
    //}
  };

  docClient.scan(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      if (callback) {
        const responseErr = {
          statusCode: 500,
          body: JSON.stringify({'err' : err}),
        };
        callback(null, responseErr);
      }
    } else {
      data.Items.forEach(function(item) {
        console.log(item);
      });

      if (callback) {
        const responseOk = {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin" : "*"
          },
          body: JSON.stringify(data.Items),
        };
        callback(null, responseOk);
      }
    }
  });
}
