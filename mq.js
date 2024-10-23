'use strict'

const mqtt = require('mqtt');
const schedule = require('node-schedule');

let dayjs = require('dayjs');
let utc = require('dayjs/plugin/utc')
let timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

const { calculateCRC } = require('./checksum');


let initMQTT = () => {
    this.mqttClient = mqtt.connect('mqtt://mq.datavn.net:1883',
        {
            username: 'dtvnMqWs',
            password: Buffer.from('ws$Dtvn^0324')
        })
    this.mqttClient.on('connect', () => {
        console.log("MQTT connected!");
        startJobSynctime();

        this.mqttClient.subscribe('dtvn/sync_time', { qos: 2 }, (err) => {
            console.log(`*****MQTT Subscribe 'dtvn/sync_time': ${err ? err : 'OK'}`);
        });
    });

    this.mqttClient.on('reconnect', () => {
        console.log("*****MQTT reconnect!")
    });
    this.mqttClient.on('disconnect', () => {
        console.log("*****MQTT disconnect!")
    });
    this.mqttClient.on('close', () => {
        console.log("*****MQTT close!")
    });
    this.mqttClient.on('offline', () => {
        console.log("*****MQTT offline!")
    });
    this.mqttClient.on('error', (err) => {
        console.log("*****MQTT error!", err)
    });

    this.mqttClient.on('message', (topic, message) => {
        if (topic.toString().match(/dtvn\/sync_time/)) {
            //                console.log(topic);
        }
    });
}

let startJobSynctime = () => {
    if (!this.synctimeSchedule) {
        this.synctimeSchedule = schedule.scheduleJob(`*/5 * * * * *`, () => {

            const now = dayjs().tz('Asia/Ho_Chi_Minh');
            let dayOfWeek = now.day(); //0-6, 0 = sunday
            //day of week: 1-7. 1 = monday, 7 = sunday
            if (dayOfWeek == 0) {
                dayOfWeek = 7; //convert to 0-6 like moment.js
            }

            let timeNew = dayjs().tz('Asia/Ho_Chi_Minh').format(`HH:mm:ss-0${dayOfWeek}/DD/MM/YYYY`);
            let dataPackageNew = `Time_update#time=${timeNew};`;

            let data2 = dataPackageNew + calculateCRC(dataPackageNew) + ";";

            this.mqttClient.publish('dtvn/sync_time', data2, { qos: 0, retain: true }, (err) => {
                if (err) { console.log(`*****MQTT publish 'dtvn/sync_time' ERR: ${err}`); }
            });
        });
    }
}

initMQTT();