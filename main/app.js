require('dotenv').config();

serverIDsPath = 'data/serverIDs.json'

import {promises as fs} from 'fs';

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const token = process.env.TOKEN;
client.login(token);

const writeServerID = function(id){
    fs.readFile(serverIDsPath,'utf-8')
       .then((rawdata) =>{
        var data = JSON.parse(rawdata,'utf8');
        if (id in data){
            console.log(id + ':already exist.');
        }else{
            console.log(id + ':new serverID');
            data["ServerIDs"].push(id);
            exportData = JSON.stringify(data);
            return fs.writeFile(serverIDsPath,exportData);
        }
    })
    .catch((e) =>{
        console.log(e);
    })
}

client.on('ready',()=>{
    console.log(`${client.user.tag}`);
});

client.on("guildCreate",guild =>{
    console.log("registered at \n" + guild.name + '\n' +guild.id);
    writeServerID(guild.id);
});


//テスト用
client.on('messageCreate',message =>{
    if(message.author.bot)return;
    if(message.content.includes('ks')){
        message.channel.send('カス！');
    }
});

