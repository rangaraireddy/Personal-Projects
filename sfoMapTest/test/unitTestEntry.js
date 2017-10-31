
var context = require.context("./unit", true, /[sS]pec\.ts$/); //make sure you have your directory and regex test set correctly!
context.keys().forEach(context);
