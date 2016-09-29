/*Essentially all I am doing is making a motor
  run at a different rate depending on the project. */

//*----Install Guide----*
//cd appDir
//npm init
//npm install
  //express --save
  //async --save
  //superagent --save

//Name dependencies
var express = require('express')//Node webframework for routing etc
var app = express()
var async = require("async")//For executing functions in a specific order
var fs = require('fs') //file save



app.listen(3000, function(){}) //Opens express on localhost:3000
