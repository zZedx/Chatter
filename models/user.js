const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose =require('passport-local-mongoose')
const userSchema = Schema({
    admin:{
        type:Boolean,
        default:false
    },
    remember:{
        type:Boolean,
        default:false
    }
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User' , userSchema)