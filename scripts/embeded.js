
function waitFor(testFx, onReady, onTimeout, timeOutMillis) {
  console.log('starting waitFor ...');
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 20000, //< Default Max Timout in s
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(function() {
          if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
              // If not time-out yet and condition not yet fulfilled
              condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
          } else {
              if(!condition) {
                  // If condition still not fulfilled (timeout but condition is 'false')
                  clearInterval(interval); //< Stop this interval
                  console.log("'waitFor()' timeout");
                  onTimeout(timeOutMillis);
              } else {
                  // Condition fulfilled (timeout and/or condition is 'true')
                  var durationMs = new Date().getTime() - start;
                  console.log("'waitFor()' finished in " + durationMs + "ms.");
                  clearInterval(interval); //< Stop this interval
                  //onReady(); //< Do what it's supposed to do once the condition is fulfilled
                  setTimeout(function() { 
                    onReady(durationMs); 
                  } , 0);
              }
          }
      }, 250); //< repeat check every 250ms
}; 

var testIsConnected = function() {
  return testIsReady() && testIsLogged();
}

var testIsLogged = function() {
  if (typeof Meteor === 'undefined' || typeof Meteor.status === 'undefined' || Meteor.status().connected === false) {
    //console.log("testIsLogged false a");
    return false;
  }
  if (typeof Meteor.user === 'undefined' ||  Meteor.user() === null) {
    //console.log("testIsLogged false b");
    return false;
  }
  if(Meteor.loggingIn() === true) {
    //console.log("testIsLogged false c");
    return false;
  }

  //console.log("testIsLogged true");
  return true;
}


var testIsReady = function() {
  if (typeof Meteor === 'undefined' || typeof Meteor.status === 'undefined' || Meteor.status().connected === false) {
    //console.log("testIsReady false a");
    return false;
  }

  Deps.flush();
  if(DDP._allSubscriptionsReady() === false) {
    //console.log("testIsReady false b");
    return false;
  }

  //console.log("testIsReady true");
  return true;
}

var firstPass = function() {
  //meteor version
  console.log("Meteor.release", Meteor.release);

  if(Session.keys!==undefined) {
    _.each(Session.keys, function(key, name) {
      console.log("Session", name, Session.get(name));
    });
  }

  //list all packages
  var packages = _.keys(Package);
  packages = packages.sort(function(a, b) { 
    if(a.indexOf(':') === b.indexOf(':')) { return a.localeCompare(b); }
    if(a.indexOf(':') ===  -1) { return -1; }
    if(b.indexOf(':') ===  -1) { return 1; }

    return 0;
  });

  var packagesDic = {};
  _.each(packages, function(name, idx) {
    packagesDic["_" + idx] = name;
    //console.log("Package", name);
  });
  //console.log("Packages ", packages);
  console.log("Packages ", packagesDic);


  if(true) {
    if(typeof Accounts !== 'undefined' && Accounts.oauth) {
      var oauthServices = Accounts.oauth.serviceNames();
      var oauths = {};
      _.each(oauthServices, function(serviceName, idx) {
        oauths["_"+idx] = serviceName;
        //console.log("oauth", serviceName);
      });
      console.log("oauths", oauths);
    }
  }

  //list all user template function (helpers + events)
  if(false) { 
    if (typeof Template !== 'undefined') {
      for(idx in Template) { //foreach template
        var template = Template[idx];
        var templateName = idx;
        if(template !== undefined && templateName !== '__dynamic') {
          if (template instanceof Blaze.Template) { //keep template type only
            
            //helpers
            _.each(template.__helpers, function(field, fieldName) {
              if(_.isFunction(field) && fieldName !== '__dynamicWithDataContext') {
                console.log("template helper : ", templateName, fieldName, field);
              }
            });

            //events
            _.each(template.__eventMaps, function(fields) {
              _.each(fields, function(field, fieldName) {
                if(_.isFunction(field)) {
                  console.log("template event : ", templateName, fieldName, field);
                }
              });
            });

          }
        }
      };
    }
  }

  //TODO ...nouveau iron router...
  if(false) {
    var ironRouter = null;
    if(Package['iron-router'] !== undefined) {
      ironRouter = {};
      ironRouter.routes = _.map(Router.routes, function(route) { 
        var options = {};
        if(route.options.data !== undefined) {
          options.data =  "" + route.options.data;
        }
        if(route.options.waitOn !== undefined) {
          options.waitOn =  "" + route.options.waitOn;
        }
        options.path = route.options.path;

        var res = { 
          name: route.name , 
          options : options,
          originalPath : route.originalPath,
          where : route.where,
        };
      });
    }  
  }


  //console.log("testIsReady", testIsReady());


}

firstPass();


var logCollection = function(col, collectionName)  {
  //console.log("logCollection", collectionName);
  
  if(col === null || col === undefined) {
    return ;
  }

  var queryAll = col.find({});
  var queryLimited = col.find({}, {limit : 10});
  var count = queryAll.count();
  
  console.log("Collection", collectionName, col._name + " size = " + count);
  
  _.each(queryLimited.fetch(), function(item) {
    console.log(item);
  });
  
}

var originalMeteorCall = Meteor.call;
var customMeteorCallCallBack = function(originalArgs, originalCallback, err, result)
{
  console.log("Meteor.Call", originalArgs, "result = " + result);
  if(originalCallback){
    originalCallback.apply(this, err, result);
  }
}
var customMeteorCall = function()
{
  var originalArgs = _.map(arguments, function(arg) { return arg; }); //copy ...
  console.log("Meteor.Call", arguments);
  var originalCallback = undefined;
  //TODO gerer le cas ou le dernier argument n'est pas une fonction
  var lastIndex = arguments.length - 1;
  if(lastIndex > 0)  {
    originalCallback = arguments[lastIndex];
  }
  var methodName = arguments[0];
  var newCallBack = function(err, result) { customMeteorCallCallBack(originalArgs, originalCallback, err, result); };
  if(lastIndex > 0)  {
    arguments[lastIndex] = newCallBack;
  }
  originalMeteorCall.apply(this, arguments);
}
Meteor.call = customMeteorCall;

var onReady = function(durationMs)
{
  //console.log("onReady durationMs = ", durationMs);

  var allCollections = [];

  if(Meteor.users!==undefined) {
    /*
    var users = Meteor.users.find({}).fetch();
    console.log("Users");
    _.each(users, function(user) {
      console.log("User", user);
    });
*/
    allCollections["users"] = Meteor.users;
    usersLog = logCollection(Meteor.users, "users");
  }


  console.log("globalCollections");
  var globalCollections = [];
  for (var collectionName in window) {
    if (window[collectionName] instanceof Meteor.Collection) {
      var col = window[collectionName];
      allCollections[col._name] = col;
      globalCollections.push(logCollection(col, collectionName));
    }
  }

  console.log("privateCollections");
  var privateCollections = [];
  for (var collectionName in Meteor.connection._mongo_livedata_collections) {
    if(!allCollections.hasOwnProperty(collectionName) ) {
      if(collectionName.indexOf("meteor") != 0) {
        var collectionWrapperName = "sheltered_" + collectionName;
        var src = Meteor.connection._mongo_livedata_collections[collectionName];
        var collectionWrapper = new Meteor.Collection(collectionWrapperName);
        collectionWrapper._name = collectionName;
        collectionWrapper._prefix = "/" + collectionName  + "/";
        collectionWrapper._collection = src;
        delete Meteor.connection._stores[collectionWrapperName]; //remove duplicated stores "Error : Called saveOriginals twice without retrieveOriginals"
        allCollections[collectionName] = collectionWrapper;
        privateCollections.push(logCollection(collectionWrapper, collectionName));
      }
    }
  }


}

var onTimeout = function(durationMs)
{
  //console.log("onTimeout durationMs = ", durationMs);
}

waitFor(
  function() { return testIsReady(); }, 
  function(durationMs) { onReady(durationMs); },
  function(durationMs) {  onTimeout(durationMs); }
    );
