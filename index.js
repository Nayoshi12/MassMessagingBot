//Node modules required for things to run
var discord = require("discord.js")
var express = require('express');
var exphbs = require('express-handlebars');
var request = require('request');
var async = require('async');
var util = require('util');

//Initialize the website handler
var app = express();
//Intialize the Discord Robot
const bot = new discord.Client()
const token = "" //Token Omitted
const prefix = "$"

//Event Handler for Event "ready" when the bot successfully logged in.
bot.on('ready', () => {
    console.log("I'm ready!")
})


//Bot login sequence
bot.login(token).then(() => {
    //Gets the array of servers that is available to the bot.
    guilds = bot.guilds.array();

    //Creates an event handler for the web server for default landing page
    app.get('/', function(req, res) {
        //Create a drop down menu for all the server available to the user
        arrayToOptions(guilds).then((data) => {
            res.render("search", {
                serverName: data
            })
        });

    });
    //Event handler for the webserver when they press the back button
    app.get('/back', function(req, res) {
        res.redirect('/');
    });
    //This is where the message is defined where the limit is settled
    app.get('/process_getA', function(req, res) {
        //Gets the guild that is selected by the user
        guild = bot.guilds.get(req.query.server);
        //Gets all the channels from the guild
        channels = guild.channels.array();
        roles = guild.roles;
        //Determines if the roles of the users and the determine where the log channel will exist
        //If the role is selected, then the user will not be message, except for anyone who does not have the role
        //The channel for the log determines if the user has been messaged successfully.
        arrayToOptions(channels).then((channelData) => {
            arrayToOptions(roles).then((roleData) => {
                res.render("message", {
                    channel: channelData,
                    role: roleData,
                    server: req.query.server
                });
            });

        });

    })
    //This is where the actual messaging happens
    app.get('/process_getB', function(req, res) {
        guild = bot.guilds.get(req.query.server);
        channel = guild.channels.get(req.query.channel);
        role = req.query.role;
        //Functions determines when the messaging is finished and it will return
        // Job is done in the log channel afterwards
        messageEveryone(guild, req.query.inputBox, channel, role).then(function() {
            channel.send("Job's done :D");
            res.redirect("/");
        });
    })
    //Boilerplate codes setting the templates to handlebars
    app.engine('handlebars', exphbs({
        defaultLayout: 'main'
    }));
    app.set('view engine', 'handlebars');

    //initialize the web server and handler in to a certain port
    var port = Number(process.env.PORT || 8000);
    app.listen(port);
})
//messageEveryone function messages everyone who is not selected in the guild
function messageEveryone(guildSelected, message, channel, role) {
    member = guildSelected.members.array();
    counter = 0;
    //Promises that the object will be returned.
    return new Promise(function(resolve, reject) {
        guildSelected.members.forEach(function(guildmember, guildmemberID) {
            counter++;
            //If the member is a bot, and the member is part of the role selected, it will not send a message
            //If it does, it will send a message to the selected channel saying, "User" was sucessfully messaged
            //Else then it will return "User" cannot be messaged.
            if (!guildmember.bot) {
                if (!guildmember.roles.get(role)) {
                    guildmember.user.send(message).then((result) => {
                        channel.send(guildmember.user.username + " was successfully messaged!");
                    }, function(err) {
                        channel.send(guildmember.user.username + " cannot be messaged. :(");
                    })
                }
                //The promise returns to the main handler after everyone not selected has been messaged
                if (counter == member.length - 1) {
                    resolve();
                }
            }
        });
    })
}

//arrayToOptions is a function that converts javascript arrays in to HTML options, 
//so it can be easier implemented in the template
function arrayToOptions(inputArray) {
    options = ""
    //Creates a promise
    return new Promise(function(resolve, reject) {
        //Every value in the array will be put in to a option and it will be able to be selected
        inputArray.forEach((item, i) => {
            options += util.format("<option value =\"%s\"> %s </option>\n", item.id, item.name)
        })
        resolve(options)
    })
}

