peeps = new Meteor.Collection("dbalbums");

Meteor.methods({'upsert': function(sid, fbid) {
  console.log('upsert', sid, fbid);

  var expr = (new Date()).getTime() + 15000;
  if (fbid !== 'ayal.gelles') {
    peeps.remove({sid: {$ne: sid}, fbid: fbid});
  }

  if (!fbid || !sid) {
    debugger;
    console.log('WTF');
    return 'WTF';
  }
  
  var peep = peeps.findOne({sid: sid});
  if (peep) {
    console.log('updating', sid, fbid);
    peeps.update(peep._id, {$set: {expr: expr, fbid: fbid, sid: sid}});
    return 'udpate';
  }
  else {
    console.log('inserting', sid, fbid);
    peeps.insert({sid: sid, fbid: fbid, expr: expr});   
    return 'insert';
  }
}});

if (Meteor.isClient) {
  
  if (!getCookie('peepsid')) {
    setCookie('peepsid', (new Date()).getTime());
  }

  console.log('sid', getCookie('peepsid'));

  $.idleTimer(500);

  function setCookie (c_name,value) {
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + 10000);
    var c_value=escape(value) + ((false) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
  };

  function getCookie (c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {

      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x==c_name)
      {

        return unescape(y);
      }
    }
  };

  window.FBStatus = $.Deferred();
  window.appid = function(){
    return location.href.indexOf('peeps.meteor.com') > -1 ? '485057264850802' : '485057264850802';	
  };

  window.fbAsyncInit = function(){
    FB.XFBML.parse();  
    FB.init({
      appId      : window.appid(), // App ID
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
    FB.getLoginStatus(function(response) {
      window.fbdata = response;
      window.FBStatus.resolve(response);
    });
  };

  $(function(){
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/all.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });


  Meteor.subscribe("thepeeps", function () {
    $(document).bind("active.idleTimer", function() {
      FBStatus.done(function() {
      console.log('status', window.fbdata, 'active');
        Meteor.call('upsert', getCookie('peepsid'), window.fbdata.authResponse ? window.fbdata.authResponse.userID : 'ayal.gelles', function(e,r){
          console.log(r);
        });
      });
    });


    console.log('the peeps!');    
    FBStatus.done(function() {
      console.log('status', window.fbdata, 'peeps');
      Meteor.call('upsert', getCookie('peepsid'), window.fbdata.authResponse ? window.fbdata.authResponse.userID : 'ayal.gelles', function(e,r){
        console.log(r);
      });
    });
  });

  Template.thepeeps.list = function () {
    return peeps.find({});
  };

  Template.thepeeps.events({
    'click input' : function () {
      FB.login(function(res) {
        console.log('logged in!', res);
        window.fbdata = res;
        Meteor.call('upsert', getCookie('peepsid'), window.fbdata.authResponse ? window.fbdata.authResponse.userID : 'ayal.gelles', function(e,r){
          console.log(r);
        });
      }, {scope: "publish_actions"});
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish("thepeeps", function () {
    return peeps.find({});
  });

  Meteor.startup(function () {
    Meteor.setInterval(function(){
      peeps.find({expr: {$lt: (new Date()).getTime()}}).forEach(function(peep){
        peeps.remove(peep);
      });
    }, 8000);
  });
}
