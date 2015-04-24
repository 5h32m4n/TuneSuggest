//Written by Matthew Sherman
Tasks = new Mongo.Collection("tasks");
Bands = new Mongo.Collection("bands");

//Routes

Router.route('/', {
  name: 'profile'
});
Router.route('home');
Router.route('search');
Router.route('suggestions');
Router.route('database');
Router.route('admin', {
  onBeforeAction: function () {
    if (Meteor.user().username !== "5h32m4n") {
      this.render('home');
    }else{
      this.next();
    }
  }
});
Router.onBeforeAction(function() {
  if (! Meteor.userId()) {
    this.render('home');
  } else {
    this.next();
  }
});
Router.route('/:user',
  function () {
    var user = this.params.user;
    Session.set("user_page", user);
    this.render('userpage');
  },
  {name: 'userpage'});
Router._scrollToHash = function(hash) {
  var section = $(hash);
  if (section.length) {
    var sectionTop = section.offset().top - 155;
    $("html, body").animate({
      scrollTop: sectionTop
    }, "slow");
  }
};

//Client

if (Meteor.isClient) {
  Meteor.subscribe('tasks', function onReady(){
         Session.set('subscription_tasks_completed', true);
  });
  Meteor.subscribe('bands', function onReady(){
         Session.set('subscription_bands_completed', true);
  });
  Meteor.subscribe("allUserData");

  Meteor.startup(function() {
    Session.set("sort_type", 1);
    Session.set("sort_order", {name: 1, rating: -1});
    Session.set("subscription_tasks_completed", false);
    Session.set("subscription_bands_completed", false);
  });

  //helpers

  Template.profile.helpers({
    tasks: function () {
      return Tasks.find({owner: Meteor.userId(), ignored: {$ne: true}}, {sort: Session.get("sort_order")});
    },
    needFavs: function () {
      var myFavs = Tasks.find({owner: Meteor.userId()}).count();
      if(myFavs > 0){
        return false;
      }else{
        return true;
      }
    },
    userInfo: function () {
      return Meteor.user().username;
    },
    numRatings: function () {
      var count = Tasks.find({owner: Meteor.userId(), ignored: {$ne: true}}).count();
      return count;
    },
    alikeUser: function () {
      if(Meteor.user().alikeUser != null){
        return Meteor.user().alikeUser;
      }else{
        return "None";
      }
    },
    hasAlike: function () {
      if(Meteor.user().alikeUser != null){ return true; }
      else { return false; }
    },
    ratingArrow: function () {
      var rateSort = Session.get("sort_type");
      if(rateSort == 3){
        return Spacebars.SafeString("&DownArrow;");
      }else if(rateSort == 4){
        return Spacebars.SafeString("&UpArrow;");
      }else{
        return Spacebars.SafeString("&UpDownArrow;");
      }
    },
    nameArrow: function () {
      var rateSort = Session.get("sort_type");
      if(rateSort == 2){
        return Spacebars.SafeString("&DownArrow;");
      }else if(rateSort == 1){
        return Spacebars.SafeString("&UpArrow;");
      }else{
        return Spacebars.SafeString("&UpDownArrow;");
      }
    }
  });

  Template.userpage.helpers({
    tasks: function () {
      return Tasks.find({username: Session.get("user_page")}, {sort: {name: 1}});
    },
    userInfo: function () {
      return Session.get("user_page");
    },
    numRatings: function () {
      var count = Tasks.find({username: Session.get("user_page"), ignored: {$ne: true}}).count();
      return count;
    },
    alikeUser: function () {
      return Meteor.users.findOne({username: Session.get("user_page")});
    },
    hasAlike: function () {
      var user = Meteor.users.findOne({username: Session.get("user_page")});
      if(user.alikeUser != null){ return true; }
      else { return false; }
    }
  });

  Template.home.helpers({
    bestBands: function (){
      return Bands.find({topTen: true}, {sort: {average: -1}, limit: 10});
    },
    lastRatings: function() {
      return Tasks.find({ignored: {$ne: true}}, {sort: {createdAt: -1}, limit: 5});
    },
    onlineUsers: function () {
      return Meteor.users.find({ "status.online": true });
    },
    isTasksCompleted: function() {
      return Session.get('subscription_tasks_completed');
    },
    isBandsCompleted: function() {
      return Session.get('subscription_bands_completed');
    }
  });

  Template.band.helpers({
    isAdmin: function () {
      return Meteor.user().username === "5h32m4n";
    }
  });

  Template.suggestions.helpers({
    suggestions: function () {
      //create three lists from your ratings
      var users = []; myFavs = []; myLikes = []; myHates = []; i = 0; j = 0; k = 0;
      Tasks.find({owner: Meteor.userId()}).forEach(function(sortRatings){
        if(sortRatings.rating > 8){
          myFavs[i] = sortRatings.name;
          i++;
        }else if(sortRatings.rating > 6){
          myLikes[j] = sortRatings.name;
          j++;
        }else if(sortRatings.rating < 4){
          myHates[k] = sortRatings.name;
          k++;
        }
      });

      //calculate number of liked bands
      var likesCount = (myLikes.length) / 5;
      likesCount = Math.round(likesCount);
      if(likesCount < 1){likesCount = 1};
      if(likesCount > 20){likesCount = 20};

      //Get a list of users that love the bands you love
      for(i = 0; i < myFavs.length; i++){
        var temp = Tasks.find({owner: {$ne: Meteor.userId()}, name: myFavs[i],
         rating: {$gt: 8}}).map(function(temp){return temp.username});
        var temp2 = users;
        users = temp2.concat(temp);
      }
      //Get a list of users that like the bands you like
      for(i = 0; i < myLikes.length; i++){
        temp = Tasks.find({owner: {$ne: Meteor.userId()}, name: myLikes[i],
         rating: {$gt: 6}}).map(function(temp){return temp.username});
        temp2 = users;
        users = temp2.concat(temp);
      }
      //Get a list of users that hate the bands you hate
      for(i = 0; i < myHates.length; i++){
        temp = Tasks.find({owner: {$ne: Meteor.userId()}, name: myHates[i],
         rating: {$lt: 4}}).map(function(temp){return temp.username});
        temp2 = users;
        users = temp2.concat(temp);
      }

      //Count the instances of each user
      var a = [], b = [], prev;
      users.sort();
      for (i = 0; i < users.length; i++ ) {
        if ( users[i] !== prev ) {
          a.push(users[i]);
          b.push(1);
        } else {
          b[b.length-1]++;
        }
        prev = users[i];
      }
      users = [];

      //Select the top users to pull from
      for (i = 0; i < a.length; i++) {
        if(b[i] >= likesCount){
          users[i] = a[i];
        }
      }

      //Intermission: Update the most alike user!
      var max = 0; alikeUser = 0;
      for (i = 0; i < b.length; i++) {
        if(b[i] > max){
          alikeUser = i;
          max = b[i];
        }
      }
      Meteor.call("updateAlikeUser", a[alikeUser]);

      //Get the favorite bands of those users
      temp = []; temp2 = [];
      var suggestions = [];
      for(i = 0; i < users.length; i++){
        temp = Tasks.find({username: users[i], rating: {$gt: 6}}).map(function(temp){return temp.name});
        temp2 = suggestions;
        suggestions = temp2.concat(temp);
      }

      //Sort out the duplicates, and the ones that you've rated
      suggestions.sort();
      var dSuggestions = []; prev = "";
      for (i = 0; i < suggestions.length; i++ ) {
        if ( suggestions[i] !== prev ) {
          if (Tasks.find({owner: Meteor.userId(), name: suggestions[i]}).count() == 0){
            dSuggestions.push(suggestions[i]);
          }
        }
        prev = suggestions[i];
      }

      //Store the suggestions averages in an array
      var suggAvgs = []; temp = []; temp2 = [];
      for(i = 0; i < dSuggestions.length; i++){
        temp = Bands.find({name: dSuggestions[i]}).map(function(suggAvgs){return suggAvgs.average});
        temp2 = suggAvgs;
        suggAvgs = temp2.concat(temp);
      }

      //Round the averages, and sort suggestions in descending order
      for(i = 0; i < suggAvgs.length; i++){
        suggAvgs[i] = Math.round(suggAvgs[i]);
      }
      var result = [];
      for(i = 10; i > 0; i--){
        for(j = 0; j < dSuggestions.length; j++){
          if(suggAvgs[j] == i){
            result.push(dSuggestions[j]);
          }
        }
      }

      //Return the first 5 suggestions in the array
      result = result.slice(0, 5);

      return result;
    },
    ignored: function () {
      return Tasks.find({owner: Meteor.userId(), ignored: true}, {sort: {name: 1}});
    }
  });

  Template.database.helpers({
    bandsSpec: function () {
      return Bands.find({$or: [
        {name: {$regex: /^\./}},
        {name: {$regex: /^\!/}},
        {name: {$regex: /^\@/}},
        {name: {$regex: /^\#/}},
        {name: {$regex: /^\$/}}
      ]}, {sort: {name: 1}});
    },
    bandsNum: function () {
      return Bands.find({$or: [
        {name: {$regex: /^0/}},
        {name: {$regex: /^1/}},
        {name: {$regex: /^2/}},
        {name: {$regex: /^3/}},
        {name: {$regex: /^4/}},
        {name: {$regex: /^5/}},
        {name: {$regex: /^6/}},
        {name: {$regex: /^7/}},
        {name: {$regex: /^8/}},
        {name: {$regex: /^9/}}
      ]}, {sort: {name: 1}});
    },
    bandsA: function () {
      return Bands.find({name: {$regex: /^A/}}, {sort: {name: 1}});
    },
    bandsB: function () {
      return Bands.find({name: {$regex: /^B/}}, {sort: {name: 1}});
    },
    bandsC: function () {
      return Bands.find({name: {$regex: /^C/}}, {sort: {name: 1}});
    },
    bandsD: function () {
      return Bands.find({name: {$regex: /^D/}}, {sort: {name: 1}});
    },
    bandsE: function () {
      return Bands.find({name: {$regex: /^E/}}, {sort: {name: 1}});
    },
    bandsF: function () {
      return Bands.find({name: {$regex: /^F/}}, {sort: {name: 1}});
    },
    bandsG: function () {
      return Bands.find({name: {$regex: /^G/}}, {sort: {name: 1}});
    },
    bandsH: function () {
      return Bands.find({name: {$regex: /^H/}}, {sort: {name: 1}});
    },
    bandsI: function () {
      return Bands.find({name: {$regex: /^I/}}, {sort: {name: 1}});
    },
    bandsJ: function () {
      return Bands.find({name: {$regex: /^J/}}, {sort: {name: 1}});
    },
    bandsK: function () {
      return Bands.find({name: {$regex: /^K/}}, {sort: {name: 1}});
    },
    bandsL: function () {
      return Bands.find({name: {$regex: /^L/}}, {sort: {name: 1}});
    },
    bandsM: function () {
      return Bands.find({name: {$regex: /^M/}}, {sort: {name: 1}});
    },
    bandsN: function () {
      return Bands.find({name: {$regex: /^N/}}, {sort: {name: 1}});
    },
    bandsO: function () {
      return Bands.find({name: {$regex: /^O/}}, {sort: {name: 1}});
    },
    bandsP: function () {
      return Bands.find({name: {$regex: /^P/}}, {sort: {name: 1}});
    },
    bandsQ: function () {
      return Bands.find({name: {$regex: /^Q/}}, {sort: {name: 1}});
    },
    bandsR: function () {
      return Bands.find({name: {$regex: /^R/}}, {sort: {name: 1}});
    },
    bandsS: function () {
      return Bands.find({name: {$regex: /^S/}}, {sort: {name: 1}});
    },
    bandsT: function () {
      return Bands.find({name: {$regex: /^T/}}, {sort: {name: 1}});
    },
    bandsU: function () {
      return Bands.find({name: {$regex: /^U/}}, {sort: {name: 1}});
    },
    bandsV: function () {
      return Bands.find({name: {$regex: /^V/}}, {sort: {name: 1}});
    },
    bandsW: function () {
      return Bands.find({name: {$regex: /^W/}}, {sort: {name: 1}});
    },
    bandsX: function () {
      return Bands.find({name: {$regex: /^X/}}, {sort: {name: 1}});
    },
    bandsY: function () {
      return Bands.find({name: {$regex: /^Y/}}, {sort: {name: 1}});
    },
    bandsZ: function () {
      return Bands.find({name: {$regex: /^Z/}}, {sort: {name: 1}});
    }
  });

  Template.admin.helpers({
      stats: function () {
      var userNames = Tasks.find().map(function(userNames){return userNames.username;});
      userNames.sort();
      var a = [], b = [], prev;
      for (i = 0; i < userNames.length; i++ ) {
        if ( userNames[i] !== prev ) {
          a.push(userNames[i]);
          b.push(1);
        } else {
          b[b.length-1]++;
        }
        prev = userNames[i];
      }
      userNames = [];
      for (i = 0; i < a.length; i++) {
        userNames[i] = a[i] + " (" + b[i] + ")";
      }
      return userNames;
    },
    usersCount: function () {
      var count = Meteor.users.find().count();
      return count;
    },
    ratingsCount: function () {
      var count = Tasks.find({ignored: {$ne: true}}).count();
      return count;
    },
    stats2: function () {
      return Tasks.find({ignored: {$ne: true}}, {sort: {name: 1}});
    }
  });

  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
    isOne: function (){
      return this.rating !== 1;
    },
    isTen: function (){
      return this.rating !== 10;
    }
  });

  Template.search.helpers({
    bands: function () {
      return Bands.find({});
    }
  });

  //events

  Template.profile.events({
    "submit .new-task": function (event) {
      var name = event.target.name.value;
      var rating = parseInt(event.target.rating.value) || 7;
      var id = this.userId;
      Meteor.call("addTask", name, rating, false);
      Meteor.call("addBand", name, rating);
      Meteor.call("calcAvg", name);
    event.target.name.value = "";
    return false;
    },
    "click .sortByRating": function () {
      var sortType = Session.get("sort_type");
      if(sortType != 3){
        Session.set("sort_order", {rating: -1, name: 1});
        Session.set("sort_type", 3);
      }else{
        Session.set("sort_order", {rating: 1, name: 1});
        Session.set("sort_type", 4);
      }
    },
    "click .sortByName": function () {
      var sortType = Session.get("sort_type");
      if(sortType != 1){
        Session.set("sort_order", {name: 1, rating: 1});
        Session.set("sort_type", 1);
      }else{
        Session.set("sort_order", {name: -1, rating: 1});
        Session.set("sort_type", 2);
      }
    },
    'keyup input#searchBox': function () {
      AutoCompletion.autocomplete({
        element: 'input#searchBox',
        collection: Bands,
        field: 'name',
        limit: 10,
        sort: { name: 1 }});
    }
  });

  Template.band.events({
    "submit .band-update": function (event) {
      var newName = event.target.name.value;
      var oldName = this.name;
      if(oldName != newName){
        Meteor.call("updateBand", oldName, newName);
      }
      event.target.name.value = "";
      return false;
    }
  });

  Template.suggestion.events({
    "submit .rated-suggestion": function (event) {
      var name = event.target.name.value;
      var rating = parseInt(event.target.rating.value);
      var id = this.userId;
      Meteor.call("addTask", name, rating, false);
      Meteor.call("calcAvg", name);
      return false;
    },
    "submit .ignore": function (event) {
      var name = event.target.name.value;
      Meteor.call("addTask", name, 0, true);
      return false;
    }
  });

  Template.task.events({
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    "click .rate-down": function () {
      if(this.rating > 1){
        Meteor.call("rateDown", this._id);
      }
    },
    "click .rate-up": function () {
      if(this.rating < 10){
        Meteor.call("rateUp", this._id);
      }
    }
  });

  Template.ignore.events({
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    }
  });

  Template.search.events({
    'keyup input#searchBox': function () {
      AutoCompletion.autocomplete({
        element: 'input#searchBox',
        collection: Bands,
        field: 'name',
        limit: 10,
        sort: { name: 1 }});
    }
  });

  Template.admin.events({
    "submit .reset-password": function (event) {
      var username = event.target.user.value;
      var password = event.target.password.value;
      var user = Meteor.users.findOne({username: username});
      var id = user._id;
      Meteor.call("changeMyPassword", id, password);
      event.target.user.value = "";
      event.target.password.value = "";
      return false;
    }
  });

  //misc

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
  });

  Template.search.rendered = function () {
    AutoCompletion.init("input#searchBox");
  }
}

//methods

Meteor.methods({
  addTask: function (name, rating, ignored) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    //sanitizing


    if(rating > 10){rating = 10;}
    if(rating < 1){rating = 1;}

    Tasks.update({
        name: name,
        owner: Meteor.userId()
      },
      {$set:{
        name: name,
        rating: rating,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username,
        ignored: ignored
      }},
      {
        upsert: true
      });
  },

  ignoreTask: function (name) {
    Tasks.insert({
      name: name,
      rating: 0,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
      ignored: true
      });
  },

  addBand: function (name, rating) {
    var count = Bands.find({name: name}).count();
    if (count === 0){
      Bands.insert({name: name});
    }
  },

  updateBand: function (oldName, newName) {
    Tasks.update( {name: oldName}, { $set : {name: newName}}, {multi: true});
    var count = Bands.find({name: newName}).count();
    if (count == 0){
      Bands.update( {name: oldName}, { $set : {name: newName}});
    }else{
      Bands.remove({name: oldName});
    }
  },

  updateAlikeUser: function (username) {
    Meteor.users.update({_id: this.userId}, {$set: {alikeUser: username}});
  },

  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskId);
    Meteor.call("calcAvg", task.name);
  },

  rateDown: function (taskId) {
    var task = Tasks.findOne(taskId);
    Tasks.update(taskId, { $inc: { rating: -1 }});
    var name = task.name;
    Meteor.call("calcAvg", name);
  },

  rateUp: function (taskId) {
    var task = Tasks.findOne(taskId);
    Tasks.update(taskId, { $inc: { rating: 1 }});
    var name = task.name;
    Meteor.call("calcAvg", name);
  },

  calcAvg: function (name) {
    var total = 0; var count = 0;
    var bandAvg = Tasks.find({name: name, ignored: {$ne: true}}).map(function(bandAvg){return bandAvg.rating;});
    for(i = 0; i < bandAvg.length; i++){
      total += bandAvg[i];
      count++;
    }
    if(count > 2){
      Bands.update({name: name}, {$set: {topTen: true}});
    }else{
      Bands.update({name: name}, {$set: {topTen: false}});
    }
    if(count > 0){
      var avg = total / count;
      avg = Math.round(10*avg)/10;
      Bands.update( {name: name}, {$set: {average: avg, ratingCount: count}});
    }else{
      Bands.update( {name: name}, {$set: {average: 0, ratingCount: 0}});
    }
  },

  changeMyPassword: function (id, newPassword) {
    Accounts.setPassword(id, newPassword);
  }
});

if (Meteor.isServer) {
  Meteor.publish("tasks", function () {
    return Tasks.find();
  });
  Meteor.publish("bands", function () {
    return Bands.find();
  });
  Meteor.publish("allUserData", function () {
    return Meteor.users.find({}, {fields: {'status.online': 1, alikeUser: 1, username: 1}});
  });
}

//Uses AutoCompletion by Sebdah, Meteor-User-Status by Mizzao, and Iron Router by MIT
