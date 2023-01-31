const database = require('./connection')
const mongoose = require("mongoose")
const schema = new mongoose.Schema({
    id: 'object',
    ts: 'object',
    val: "object"
},
    { collection: 'measurements' });
const siteSchema = new mongoose.Schema({
    id: 'object',
    dis: 'string',
    site: 'object',
    geoCity: 'string',
    geoState: 'string',
    geoAddr: 'string',
    tz: 'string',
    area: 'object',
}, { collection: 'sites' })

const pointSchema = new mongoose.Schema({
    id: 'object',
    dis: 'string',
    point: 'object',
    his: 'object',
    siteRef: 'object',
    kind: 'string',
    tz: 'string',
    tags: [{
        type: String
    }]
}, { collection: 'points' })
const Measurement = database.model('measurment', schema);
const Site = database.model('site', siteSchema)
const Point = database.model('point', pointSchema)

exports.Measurement = Measurement
exports.Site = Site
exports.Point = Point